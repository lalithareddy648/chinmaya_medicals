import { Carts, Medicines, Settings } from '../config/db.js';

// Helper to populate and calculate cart details
const getPopulatedCart = async (userId) => {
  let cart = await Carts.findOne({ userId });
  if (!cart) {
    cart = await Carts.create({ userId, items: [] });
  }

  const populatedItems = [];
  let itemsPrice = 0;
  let hasPrescriptionRequiredItems = false;

  for (const item of cart.items) {
    const medicine = await Medicines.findById(item.medicineId);
    if (medicine) {
      const lineTotal = medicine.price * item.quantity;
      itemsPrice += lineTotal;
      if (medicine.needsPrescription) {
        hasPrescriptionRequiredItems = true;
      }
      populatedItems.push({
        medicineId: item.medicineId,
        name: medicine.name,
        category: medicine.category,
        price: medicine.price,
        stock: medicine.stock,
        needsPrescription: medicine.needsPrescription,
        quantity: item.quantity,
        total: lineTotal
      });
    }
  }

  let discountPct = 15;
  try {
    const settings = await Settings.findOne();
    if (settings && settings.discountPercentage !== undefined) {
      discountPct = settings.discountPercentage;
    }
  } catch (err) {
    console.error('Error loading discount setting:', err);
  }

  const discount = Math.round(itemsPrice * (discountPct / 100));
  const totalPrice = itemsPrice - discount;

  return {
    _id: cart._id,
    userId: cart.userId,
    items: populatedItems,
    itemsPrice,
    discount,
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
    const medicine = await Medicines.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    let cart = await Carts.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Carts.create({ userId: req.user._id, items: [] });
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

    await Carts.findByIdAndUpdate(cart._id, { items: cart.items });

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
    const medicine = await Medicines.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (Number(quantity) > medicine.stock) {
      return res.status(400).json({ message: `Insufficient stock. Only ${medicine.stock} left.` });
    }

    const cart = await Carts.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => String(item.medicineId) === String(medicineId));

    if (itemIndex > -1) {
      if (Number(quantity) <= 0) {
        // Remove item if quantity is 0 or less
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = Number(quantity);
      }
      await Carts.findByIdAndUpdate(cart._id, { items: cart.items });
    } else {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const cartDetails = await getPopulatedCart(req.user._id);
    res.json(cartDetails);
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:medicineId
// @access  Private
export const removeCartItem = async (req, res) => {
  try {
    const cart = await Carts.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => String(item.medicineId) !== String(req.params.medicineId));
    await Carts.findByIdAndUpdate(cart._id, { items: cart.items });

    const cartDetails = await getPopulatedCart(req.user._id);
    res.json(cartDetails);
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Carts.findOne({ userId: req.user._id });
    if (cart) {
      await Carts.findByIdAndUpdate(cart._id, { items: [] });
    }
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
