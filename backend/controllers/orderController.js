import { Orders, Carts, Medicines, Users } from '../config/db.js';

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
export const placeOrder = async (req, res) => {
  const { shippingAddress, paymentMethod, prescriptionPath } = req.body;

  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode || !shippingAddress.phone) {
    return res.status(400).json({ message: 'Please provide full shipping details' });
  }

  try {
    // 1. Fetch user's cart
    const cart = await Carts.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // 2. Fetch full medicine details, calculate prices, check stocks
    const orderItems = [];
    let itemsPrice = 0;
    let hasPrescriptionRequiredItems = false;

    for (const item of cart.items) {
      const medicine = await Medicines.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({ message: `Medicine not found for ID: ${item.medicineId}` });
      }

      if (medicine.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}` 
        });
      }

      if (medicine.needsPrescription) {
        hasPrescriptionRequiredItems = true;
      }

      const itemTotal = medicine.price * item.quantity;
      itemsPrice += itemTotal;

      orderItems.push({
        medicineId: item.medicineId,
        name: medicine.name,
        category: medicine.category,
        price: medicine.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Check if prescription was uploaded for required medicines
    if (hasPrescriptionRequiredItems && !prescriptionPath) {
      return res.status(400).json({ 
        message: 'A prescription file is required for one or more medicines in your cart' 
      });
    }

    const discount = Math.round(itemsPrice * 0.15); // 15% discount
    const totalPrice = itemsPrice - discount;

    // 3. Reduce inventory stocks
    for (const item of cart.items) {
      const medicine = await Medicines.findById(item.medicineId);
      await Medicines.findByIdAndUpdate(item.medicineId, {
        stock: medicine.stock - item.quantity
      });
    }

    // 4. Create order record
    const order = await Orders.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      items: orderItems,
      itemsPrice,
      discount,
      totalPrice,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      prescription: prescriptionPath || null,
      deliveryStatus: 'Placed' // Placed, Confirmed, Packed, Out For Delivery, Delivered
    });

    // 5. Clear user's cart
    await Carts.findByIdAndUpdate(cart._id, { items: [] });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order placement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Orders.find({ userId: req.user._id });
    // Sort orders descending by date
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure users can only view their own orders (unless admin)
    if (String(order.userId) !== String(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all orders (Admin Only)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Orders.find({});
    // Sort descending by date
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order delivery status (Admin Only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Placed', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Please provide a valid delivery status' });
  }

  try {
    const order = await Orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updatedOrder = await Orders.findByIdAndUpdate(req.params.id, {
      deliveryStatus: status
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
