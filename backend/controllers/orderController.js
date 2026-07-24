import { pool } from '../config/db.js';

// Convert snake_case db rows to camelCase frontend expectations
const formatOrder = (orderRow, itemsRows) => ({
  _id: orderRow.id,
  userId: orderRow.user_id,
  userName: orderRow.user_name,
  userEmail: orderRow.user_email,
  items: itemsRows.map(item => ({
    medicineId: item.medicine_id,
    name: item.name,
    category: item.category,
    price: Number(item.price),
    discount: Number(item.discount),
    discountedPrice: Number(item.discounted_price),
    quantity: item.quantity,
    total: Number(item.total)
  })),
  totalAmount: Number(orderRow.total_amount),
  shippingAddress: orderRow.shipping_address,
  paymentMethod: orderRow.payment_method,
  paymentStatus: orderRow.payment_status,
  deliveryStatus: orderRow.delivery_status,
  prescriptionUrl: orderRow.prescription_url,
  customerCoordinates: orderRow.customer_coordinates,
  driverCoordinates: orderRow.driver_coordinates,
  createdAt: orderRow.created_at,
  updatedAt: orderRow.updated_at
});

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
export const placeOrder = async (req, res) => {
  const { shippingAddress, paymentMethod, prescriptionPath, deliveryType } = req.body;

  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode || !shippingAddress.phone) {
    return res.status(400).json({ message: 'Please provide full shipping details' });
  }

  try {
    // 1. Fetch user's cart
    const cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [req.user._id]);
    if (cartRes.rows.length === 0 || cartRes.rows[0].items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }
    const cart = cartRes.rows[0];

    // 2. Fetch full medicine details, calculate prices, check stocks
    let discountPct = 15;
    try {
      const settingsRes = await pool.query('SELECT * FROM settings LIMIT 1');
      if (settingsRes.rows.length > 0 && settingsRes.rows[0].discount_percentage !== undefined) {
        discountPct = Number(settingsRes.rows[0].discount_percentage);
      }
    } catch (err) {
      console.error('Error loading discount setting:', err);
    }

    const orderItems = [];
    let itemsPrice = 0;
    let totalDiscount = 0;
    let hasPrescriptionRequiredItems = false;

    for (const item of cart.items) {
      const medRes = await pool.query('SELECT * FROM medicines WHERE id = $1', [item.medicineId]);
      if (medRes.rows.length === 0) {
        return res.status(404).json({ message: `Medicine not found for ID: ${item.medicineId}` });
      }
      const medicine = medRes.rows[0];

      if (medicine.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}` 
        });
      }

      if (medicine.needs_prescription) {
        hasPrescriptionRequiredItems = true;
      }

      const medDiscount = Number(medicine.discount);
      const itemDiscountPct = (medDiscount > 0) ? medDiscount : discountPct;
      const medPrice = Number(medicine.price);

      const unitDiscount = Math.round(medPrice * (itemDiscountPct / 100));
      const discountedUnitPrice = medPrice - unitDiscount;
      const lineOriginalTotal = medPrice * item.quantity;
      const lineDiscount = unitDiscount * item.quantity;
      const lineTotal = discountedUnitPrice * item.quantity;

      itemsPrice += lineOriginalTotal;
      totalDiscount += lineDiscount;

      orderItems.push({
        medicineId: item.medicineId,
        name: medicine.name,
        category: medicine.category,
        price: medPrice, // Base/MRP
        discount: itemDiscountPct,
        discountedPrice: discountedUnitPrice,
        quantity: item.quantity,
        total: lineTotal
      });
    }

    // Check if prescription was uploaded for required medicines
    if (hasPrescriptionRequiredItems && !prescriptionPath) {
      return res.status(400).json({ 
        message: 'A prescription file is required for one or more medicines in your cart' 
      });
    }

    // Calculate delivery charge: Free for local, 500rs above order for non-local, otherwise 50rs
    const deliveryCharge = (deliveryType === 'Non-local' && (itemsPrice - totalDiscount) < 500) ? 50 : 0;
    const totalPrice = itemsPrice - totalDiscount + deliveryCharge;

    // 3. Reduce inventory stocks
    for (const item of cart.items) {
      await pool.query('UPDATE medicines SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [item.quantity, item.medicineId]);
    }

    // Generate random but persistent customer coordinates around Narasaraopet
    const customerCoordinates = {
      lat: 16.2361 + (Math.random() * 0.04 - 0.02),
      lng: 80.0519 + (Math.random() * 0.04 - 0.02)
    };
    const driverCoordinates = {
      lat: 16.2361,
      lng: 80.0519
    };

    // 4. Create order record
    const id = Math.random().toString(36).substring(2, 11);
    
    // Convert to JSON for address and coords
    const shippingAddressJson = JSON.stringify(shippingAddress);
    const custCoordsJson = JSON.stringify(customerCoordinates);
    const drvCoordsJson = JSON.stringify(driverCoordinates);
    
    await pool.query(
      `INSERT INTO orders (id, user_id, user_name, user_email, total_amount, shipping_address, payment_method, payment_status, delivery_status, prescription_url, customer_coordinates, driver_coordinates) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id, req.user._id, req.user.name, req.user.email, totalPrice, shippingAddressJson,
        paymentMethod || 'Cash on Delivery', 'Pending', 'Placed', prescriptionPath || null, custCoordsJson, drvCoordsJson
      ]
    );

    // 4b. Create order_items records
    for (const oi of orderItems) {
      const oiId = Math.random().toString(36).substring(2, 11);
      await pool.query(
        `INSERT INTO order_items (id, order_id, medicine_id, name, category, price, discount, discounted_price, quantity, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [oiId, id, oi.medicineId, oi.name, oi.category, oi.price, oi.discount, oi.discountedPrice, oi.quantity, oi.total]
      );
    }

    // 5. Clear user's cart
    await pool.query('UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify([]), cart.id]);

    const newOrderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    res.status(201).json(formatOrder(newOrderRes.rows[0], itemsRes.rows));
  } catch (error) {
    console.error('Order placement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to simulate driver movement dynamically
const checkAndSimulateTracking = async (orderRow) => {
  if (!orderRow) return orderRow;
  
  // Fetch items for the order
  const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderRow.id]);
  let order = formatOrder(orderRow, itemsRes.rows);

  // Fallback to populate coordinates if not exist on old seeded orders
  if (!order.customerCoordinates) {
    order.customerCoordinates = {
      lat: 16.2361 + (Math.random() * 0.04 - 0.02),
      lng: 80.0519 + (Math.random() * 0.04 - 0.02)
    };
  }
  if (!order.driverCoordinates) {
    order.driverCoordinates = {
      lat: 16.2361, // Store default location
      lng: 80.0519
    };
  }

  // If order is out for delivery, simulate movement towards customer
  if (order.deliveryStatus === 'Out For Delivery') {
    // Generate slight noise in coordinates based on current time
    // This creates an illusion of live movement that is deterministic without websockets
    const timeFactor = Date.now() / 5000;
    
    // Interpolate towards customer
    const dx = order.customerCoordinates.lng - 80.0519;
    const dy = order.customerCoordinates.lat - 16.2361;
    
    // Simulate progression based on creation time, up to 90%
    const ageInMinutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
    const progress = Math.min(0.9, ageInMinutes / 30); // Assume 30 min delivery
    
    // Add jitter
    const jitterX = Math.sin(timeFactor) * 0.001;
    const jitterY = Math.cos(timeFactor) * 0.001;

    order.driverCoordinates = {
      lat: 16.2361 + (dy * progress) + jitterY,
      lng: 80.0519 + (dx * progress) + jitterX
    };
  } else if (order.deliveryStatus === 'Delivered') {
    // Driver arrived
    order.driverCoordinates = { ...order.customerCoordinates };
  }

  return order;
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const ordersRes = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user._id]);
    
    // Apply dynamic tracking simulator mapping
    const ordersWithTracking = await Promise.all(ordersRes.rows.map(checkAndSimulateTracking));
    
    res.json(ordersWithTracking);
  } catch (error) {
    console.error('Fetch user orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    
    if (orderRes.rows.length > 0) {
      const order = orderRes.rows[0];
      // Make sure the user owns the order, or is an admin
      if (String(order.user_id) === String(req.user._id) || req.user.isAdmin) {
        const orderWithTracking = await checkAndSimulateTracking(order);
        res.json(orderWithTracking);
      } else {
        res.status(403).json({ message: 'Not authorized to view this order' });
      }
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Fetch single order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const ordersRes = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const ordersWithTracking = await Promise.all(ordersRes.rows.map(checkAndSimulateTracking));
    res.json(ordersWithTracking);
  } catch (error) {
    console.error('Fetch all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  const { deliveryStatus, paymentStatus } = req.body;

  try {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderRes.rows[0];
    const newDeliveryStatus = deliveryStatus || order.delivery_status;
    const newPaymentStatus = paymentStatus || order.payment_status;

    await pool.query('UPDATE orders SET delivery_status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', 
      [newDeliveryStatus, newPaymentStatus, req.params.id]);

    const updatedOrderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    const orderWithTracking = await checkAndSimulateTracking(updatedOrderRes.rows[0]);
    res.json(orderWithTracking);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
