import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { pool } from '../config/db.js';

// Controller to handle chat requests
export const handleAgentChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // Fetch current inventory
    const medicinesRes = await pool.query('SELECT * FROM medicines');
    const inventoryInfo = medicinesRes.rows.map(m => {
      let info = `- ${m.name} (Category: ${m.category}, Price: ₹${m.price}, Stock: ${m.stock}`;
      if (m.expiry_date) info += `, Expiry: ${m.expiry_date}`;
      if (m.image) info += `, Real Image Available: Yes`;
      info += `)`;
      return info;
    }).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = `You are a helpful, professional AI Medical Assistant for Chinmaya Medicals. Your role is to help customers find medicines, provide general health information, and answer questions about symptoms. Always advise users to consult a real doctor for serious conditions. Be concise, polite, and reassuring.\n\nHere is our current store inventory:\n${inventoryInfo}`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt
    });

    // Rebuild history to ensure it alternates properly and starts with a 'user' message
    const formattedHistory = [];
    let expectedRole = 'user';

    for (const msg of (history || [])) {
      if (msg.role === expectedRole) {
        formattedHistory.push(msg);
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      } else if (msg.role === 'user' && expectedRole === 'user') {
        // Should not happen, but if we have consecutive user messages, just merge them or replace
        formattedHistory.push(msg);
        expectedRole = 'model';
      } else if (msg.role === 'model' && expectedRole === 'user') {
        // Skip model messages if we are expecting a user message
        continue;
      }
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ response: text });
  } catch (error) {
    console.error('Agent Error:', error);
    res.status(500).json({ error: 'Failed to process chat request.' });
  }
};

export const readPrescription = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No prescription file provided.' });
    }

    const fileData = fs.readFileSync(req.file.path);
    const base64Image = fileData.toString('base64');
    
    const medicinesRes = await pool.query('SELECT * FROM medicines');
    const inventoryInfo = medicinesRes.rows.map(m => `- ${m.name} (ID: ${m.id})`).join('\n');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: `You are a strict prescription analyzer. The store has these medicines:\n${inventoryInfo}\nRead the prescription image. Map any prescribed medicine to the EXACT ID from the inventory list above if there is a match. You must return ONLY a valid JSON object in this exact format: { "items": [{ "medicineId": "some-id", "quantity": 1 }] }`
    });

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [
            { inlineData: { data: base64Image, mimeType: req.file.mimetype } },
            { text: "Extract the medicines and quantities." }
          ]
        }
      ],
      generationConfig: { responseMimeType: "application/json" }
    });

    const responseText = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: 'AI failed to parse prescription correctly.' });
    }

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return res.status(500).json({ error: 'AI returned invalid format.' });
    }

    let cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [req.user._id]);
    let userCart;
    if (cartRes.rows.length === 0) {
      const cartId = Math.random().toString(36).substring(2, 11);
      await pool.query('INSERT INTO carts (id, user_id, items) VALUES ($1, $2, $3)', [cartId, req.user._id, JSON.stringify([])]);
      userCart = { id: cartId, items: [] };
    } else {
      userCart = cartRes.rows[0];
    }
    
    let addedCount = 0;
    for (const item of parsed.items) {
       const medRes = await pool.query('SELECT * FROM medicines WHERE id = $1', [item.medicineId]);
       if (medRes.rows.length > 0) {
           const med = medRes.rows[0];
           const existingItem = userCart.items.find(i => String(i.medicineId) === String(med.id));
           if (existingItem) {
               existingItem.quantity += (item.quantity || 1);
           } else {
               userCart.items.push({
                   medicineId: med.id,
                   quantity: item.quantity || 1
               });
           }
           addedCount++;
       }
    }
    await pool.query('UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(userCart.items), userCart.id]);
    
    res.json({ 
      success: true, 
      message: addedCount > 0 ? `Successfully analyzed prescription and auto-filled ${addedCount} items to your cart.` : 'AI could not match any medicines in the prescription to our current store inventory.', 
      addedCount 
    });
  } catch (error) {
    console.error('Prescription Read Error:', error);
    res.status(500).json({ error: 'Failed to process prescription image.' });
  }
};
