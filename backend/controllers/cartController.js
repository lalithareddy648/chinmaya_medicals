import { pool } from '../config/db.js';

// Helper to populate and calculate cart details
const getPopulatedCart = async (userId) => {
  let cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
  let cart;
  if (cartRes.rows.length === 0) {
    const id = Math.random().toString(36).substring(2, 11);
    await pool.query('INSERT INTO carts (id, user_id, items) VALUES ($1, $2, $3)', [id, userId, JSON.stringify([])]);
    cart = { id, user_id: userId, items: [] };
  } else {
    cart = cartRes.rows[0];
  }

  let discountPct = 15;
  try {
    const settingsRes = await pool.query('SELECT * FROM settings LIMIT 1');
    if (settingsRes.rows.length > 0 && settingsRes.rows[0].discount_percentage !== undefined) {
      discountPct = Number(settingsRes.rows[0].discount_percentage);
    }
  } catch (err) {
    console.error('Error loading discount setting:', err);
  }

  const populatedItems = [];
  let itemsPrice = 0;
  let totalDiscount = 0;
  let totalPrice = 0;
  let hasPrescriptionRequiredItems = false;

  for (const item of cart.items) {
    const medRes = await pool.query('SELECT * FROM medicines WHERE id = $1', [item.medicineId]);
    if (medRes.rows.length > 0) {
      const medicine = medRes.rows[0];
      const medPrice = Number(medicine.price);
      const medDiscount = Number(medicine.discount);

      const itemDiscountPct = (medDiscount > 0) ? medDiscount : discountPct;

      const unitDiscount = Math.round(medPrice * (itemDiscountPct / 100));
      const discountedUnitPrice = medPrice - unitDiscount;
      const lineOriginalTotal = medPrice * item.quantity;
      const lineDiscount = unitDiscount * item.quantity;
      const lineTotal = discountedUnitPrice * item.quantity;

      itemsPrice += lineOriginalTotal;
      totalDiscount += lineDiscount;
      totalPrice += lineTotal;

      if (medicine.needs_prescription) {
        hasPrescriptionRequiredItems = true;
      }
      populatedItems.push({
        medicineId: item.medicineId,
        name: medicine.name,
        category: medicine.category,
        price: medPrice, // Base/MRP
        discount: itemDiscountPct,
        discountedPrice: discountedUnitPrice,
        stock: medicine.stock,
        needsPrescription: medicine.needs_prescription,
        manufacturer: medicine.manufacturer,
        expiryDate: medicine.expiry_date,
        quantity: item.quantity,
        total: lineTotal
      });
    }
  }

  return {
    _id: cart.id,
    userId: cart.user_id,
    items: populatedItems,
    itemsPrice,
    discount: totalDiscount,
    totalPrice,
    hasPrescriptionRequiredItems
  };
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const cartDetails = await getPopulatedCart(req.user._id);
    res.json(cartDetails);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  const { medicineId, quantity = 1 } = req.body;

  if (!medicineId) {
    return res.status(400).json({ message: 'Medicine ID is required' });
  }

  try {
    // Check medicine stock
    const medRes = await pool.query('SELECT * FROM medicines WHERE id = $1', [medicineId]);
    if (medRes.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    const medicine = medRes.rows[0];

    let cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [req.user._id]);
    let cart;
    if (cartRes.rows.length === 0) {
      const id = Math.random().toString(36).substring(2, 11);
      await pool.query('INSERT INTO carts (id, user_id, items) VALUES ($1, $2, $3)', [id, req.user._id, JSON.stringify([])]);
      cart = { id, items: [] };
    } else {
      cart = cartRes.rows[0];
    }

    const itemIndex = cart.items.findIndex(item => String(item.medicineId) === String(medicineId));

    if (itemIndex > -1) {
      // Medicine already in cart, increment quantity
      const newQty = cart.items[itemIndex].quantity + Number(quantity);
      if (newQty > medicine.stock) {
        return res.status(400).json({ message: `Cannot add more. Insufficient stock. Only ${medicine.stock} left.` });
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      // Add new medicine to cart
      if (Number(quantity) > medicine.stock) {
        return res.status(400).json({ message: `Cannot add. Insufficient stock. Only ${medicine.stock} left.` });
      }
      cart.items.push({ medicineId, quantity: Number(quantity) });
    }

    await pool.query('UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(cart.items), cart.id]);

    const cartDetails = await getPopulatedCart(req.user._id);
    res.json(cartDetails);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart
// @access  Private
export const updateCartItem = async (req, res) => {
  const { medicineId, quantity } = req.body;

  if (!medicineId || quantity === undefined) {
    return res.status(400).json({ message: 'Medicine ID and quantity are required' });
  }

  try {
    const medRes = await pool.query('SELECT * FROM medicines WHERE id = $1', [medicineId]);
    if (medRes.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    const medicine = medRes.rows[0];

    const cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [req.user._id]);
    if (cartRes.rows.length === 0) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    const cart = cartRes.rows[0];

    const itemIndex = cart.items.findIndex(item => String(item.medicineId) === String(medicineId));

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    const newQty = Number(quantity);

    if (newQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      if (newQty > medicine.stock) {
        return res.status(400).json({ message: `Cannot update. Insufficient stock. Only ${medicine.stock} left.` });
      }
      cart.items[itemIndex].quantity = newQty;
    }

    await pool.query('UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(cart.items), cart.id]);

    const cartDetails = await getPopulatedCart(req.user._id);
    res.json(cartDetails);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:medicineId
// @access  Private
export const removeCartItem = async (req, res) => {
  const { medicineId } = req.params;

  try {
    const cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [req.user._id]);
    if (cartRes.rows.length > 0) {
      const cart = cartRes.rows[0];
      const newItems = cart.items.filter(item => String(item.medicineId) !== String(medicineId));
      await pool.query('UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(newItems), cart.id]);
    }

    const cartDetails = await getPopulatedCart(req.user._id);
    res.json(cartDetails);
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [req.user._id]);
    if (cartRes.rows.length > 0) {
      await pool.query('UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify([]), cartRes.rows[0].id]);
    }
    const cartDetails = await getPopulatedCart(req.user._id);
    res.json(cartDetails);
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
