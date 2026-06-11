import { Medicines } from '../config/db.js';

// @desc    Get all medicines (with search and filter)
// @route   GET /api/medicines
// @access  Public
export const getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    let list = await Medicines.find(query);

    // If search keyword is provided, filter list locally for robust matching
    if (search) {
      const keyword = search.toLowerCase();
      list = list.filter(med =>
        med.name.toLowerCase().includes(keyword) ||
        med.description.toLowerCase().includes(keyword) ||
        (med.manufacturer && med.manufacturer.toLowerCase().includes(keyword))
      );
    }

    res.json(list);
  } catch (error) {
    console.error('Fetch medicines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single medicine details
// @route   GET /api/medicines/:id
// @access  Public
export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicines.findById(req.params.id);
    if (medicine) {
      res.json(medicine);
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    console.error('Fetch medicine details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new medicine
// @route   POST /api/medicines
// @access  Private/Admin
export const createMedicine = async (req, res) => {
  const { name, category, description, price, discount, stock, needsPrescription, manufacturer, dosage } = req.body;

  if (!name || !category || !price || stock === undefined) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Validate discount
  const discountVal = Number(discount) || 0;
  if (discountVal < 0 || discountVal > 100) {
    return res.status(400).json({ message: 'Discount must be between 0 and 100' });
  }

  try {
    const medicine = await Medicines.create({
      name,
      category,
      description: description || '',
      price: Number(price),
      discount: discountVal,
      stock: Number(stock),
      needsPrescription: needsPrescription === true || needsPrescription === 'true',
      manufacturer: manufacturer || '',
      dosage: dosage || ''
    });

    res.status(201).json(medicine);
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a medicine (including per-product discount)
// @route   PUT /api/medicines/:id
// @access  Private/Admin
export const updateMedicine = async (req, res) => {
  const { name, category, description, price, discount, stock, needsPrescription, manufacturer, dosage } = req.body;

  try {
    const medicine = await Medicines.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Handle discount: keep existing if not provided
    let discountVal = medicine.discount !== undefined ? medicine.discount : 0;
    if (discount !== undefined) {
      discountVal = Number(discount);
      if (discountVal < 0 || discountVal > 100) {
        return res.status(400).json({ message: 'Discount must be between 0 and 100' });
      }
    }

    const updatedData = {
      name: name !== undefined ? name : medicine.name,
      category: category !== undefined ? category : medicine.category,
      description: description !== undefined ? description : medicine.description,
      price: price !== undefined ? Number(price) : medicine.price,
      discount: discountVal,
      stock: stock !== undefined ? Number(stock) : medicine.stock,
      needsPrescription: needsPrescription !== undefined
        ? (needsPrescription === true || needsPrescription === 'true')
        : medicine.needsPrescription,
      manufacturer: manufacturer !== undefined ? manufacturer : medicine.manufacturer,
      dosage: dosage !== undefined ? dosage : medicine.dosage
    };

    const updatedMedicine = await Medicines.findByIdAndUpdate(req.params.id, updatedData);
    res.json(updatedMedicine);
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a medicine
// @route   DELETE /api/medicines/:id
// @access  Private/Admin
export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicines.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    await Medicines.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
