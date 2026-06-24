import { Orders, Carts, Medicines, Users, Settings } from '../config/db.js';

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
    const cart = await Carts.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // 2. Fetch full medicine details, calculate prices, check stocks
    let discountPct = 15;
    try {
      const settings = await Settings.findOne();
      if (settings && settings.discountPercentage !== undefined) {
        discountPct = settings.discountPercentage;
      }
    } catch (err) {
      console.error('Error loading discount setting:', err);
    }

    const orderItems = [];
    let itemsPrice = 0;
    let totalDiscount = 0;
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

      const itemDiscountPct = (medicine.discount !== undefined && medicine.discount > 0)
        ? Number(medicine.discount)
        : discountPct;

      const unitDiscount = Math.round(medicine.price * (itemDiscountPct / 100));
      const discountedUnitPrice = medicine.price - unitDiscount;
      const lineOriginalTotal = medicine.price * item.quantity;
      const lineDiscount = unitDiscount * item.quantity;
      const lineTotal = discountedUnitPrice * item.quantity;

      itemsPrice += lineOriginalTotal;
      totalDiscount += lineDiscount;

      orderItems.push({
        medicineId: item.medicineId,
        name: medicine.name,
        category: medicine.category,
        price: medicine.price, // Base/MRP
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
      const medicine = await Medicines.findById(item.medicineId);
      await Medicines.findByIdAndUpdate(item.medicineId, {
        stock: medicine.stock - item.quantity
      });
    }

    // Save shipping address to user profile
    await Users.findByIdAndUpdate(req.user._id, {
      shippingAddress
    });

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
    const order = await Orders.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      items: orderItems,
      itemsPrice,
      discount: totalDiscount,
      deliveryType: deliveryType || 'Local',
      deliveryCharge,
      totalPrice,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      prescription: prescriptionPath || null,
      deliveryStatus: 'Placed', // Placed, Confirmed, Packed, Out For Delivery, Delivered
      customerCoordinates,
      driverCoordinates
    });

    // 5. Clear user's cart
    await Carts.findByIdAndUpdate(cart._id, { items: [] });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order placement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to simulate driver movement dynamically
const checkAndSimulateTracking = async (order) => {
  if (!order) return order;

  // Fallback to populate coordinates if not exist on old seeded orders
  if (!order.customerCoordinates) {
    order.customerCoordinates = {
      lat: 16.2361 + (Math.random() * 0.04 - 0.02),
      lng: 80.0519 + (Math.random() * 0.04 - 0.02)
    };
  }
  if (!order.driverCoordinates) {
    order.driverCoordinates = { lat: 16.2361, lng: 80.0519 };
  }

  if (order.deliveryStatus === 'Out For Delivery') {
    const updatedAtTime = new Date(order.updatedAt).getTime();
    const elapsedSeconds = (Date.now() - updatedAtTime) / 1000;
    const duration = 60; // 60 seconds total trip for demo

    if (elapsedSeconds >= duration) {
      // Auto-update to Delivered
      order.deliveryStatus = 'Delivered';
      order.driverCoordinates = { ...order.customerCoordinates };
      await Orders.findByIdAndUpdate(order._id, {
        deliveryStatus: 'Delivered',
        driverCoordinates: order.driverCoordinates
      });
    } else {
      // Interpolate driver position
      const ratio = elapsedSeconds / duration;
      const startLat = 16.2361;
      const startLng = 80.0519;
      order.driverCoordinates = {
        lat: startLat + (order.customerCoordinates.lat - startLat) * ratio,
        lng: startLng + (order.customerCoordinates.lng - startLng) * ratio
      };
    }
  } else if (order.deliveryStatus === 'Delivered') {
    order.driverCoordinates = { ...order.customerCoordinates };
  } else {
    order.driverCoordinates = { lat: 16.2361, lng: 80.0519 };
  }

  return order;
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Orders.find({ userId: req.user._id });
    // Sort orders descending by date
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const processedOrders = [];
    for (const order of orders) {
      processedOrders.push(await checkAndSimulateTracking(order));
    }

    res.json(processedOrders);
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

    const processedOrder = await checkAndSimulateTracking(order);
    res.json(processedOrder);
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
    
    const processedOrders = [];
    for (const order of orders) {
      processedOrders.push(await checkAndSimulateTracking(order));
    }

    res.json(processedOrders);
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

    const updateFields = { deliveryStatus: status };
    if (status === 'Out For Delivery') {
      updateFields.driverCoordinates = { lat: 16.2361, lng: 80.0519 };
    } else if (status === 'Delivered') {
      // Fetch customer coordinates
      const custCoords = order.customerCoordinates || {
        lat: 16.2361 + (Math.random() * 0.04 - 0.02),
        lng: 80.0519 + (Math.random() * 0.04 - 0.02)
      };
      updateFields.driverCoordinates = custCoords;
    }

    const updatedOrder = await Orders.findByIdAndUpdate(req.params.id, updateFields);
    const processedOrder = await checkAndSimulateTracking(updatedOrder);

    res.json(processedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
