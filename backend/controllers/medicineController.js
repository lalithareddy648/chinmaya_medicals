import { pool } from '../config/db.js';
import crypto from 'crypto';

// Convert snake_case db rows to camelCase frontend expectations
const formatMedicine = (row) => ({
  _id: row.id,
  name: row.name,
  category: row.category,
  description: row.description,
  price: Number(row.price),
  discount: Number(row.discount),
  stock: row.stock,
  needsPrescription: row.needs_prescription,
  manufacturer: row.manufacturer,
  dosage: row.dosage,
  image: row.image,
  expiryDate: row.expiry_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// @desc    Get all medicines (with search and filter)
// @route   GET /api/medicines
// @access  Public
export const getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;
    let queryStr = 'SELECT * FROM medicines';
    let queryParams = [];

    if (category && category !== 'All') {
      queryStr += ' WHERE category = $1';
      queryParams.push(category);
    }

    const resDb = await pool.query(queryStr, queryParams);
    let list = resDb.rows.map(formatMedicine);

    // If search keyword is provided, filter list locally for robust matching
    if (search) {
      const keyword = search.toLowerCase();
      list = list.filter(med =>
        med.name.toLowerCase().includes(keyword) ||
        (med.description && med.description.toLowerCase().includes(keyword)) ||
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
    const resDb = await pool.query('SELECT * FROM medicines WHERE id = $1', [req.params.id]);
    if (resDb.rows.length > 0) {
      res.json(formatMedicine(resDb.rows[0]));
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
  const { name, category, description, price, discount, stock, needsPrescription, manufacturer, dosage, image, expiryDate } = req.body;

  if (!name || !category || !price || stock === undefined) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Validate discount
  const discountVal = Number(discount) || 0;
  if (discountVal < 0 || discountVal > 100) {
    return res.status(400).json({ message: 'Discount must be between 0 and 100' });
  }

  try {
    const id = crypto.randomUUID();
    const np = needsPrescription === true || needsPrescription === 'true';

    await pool.query(
      `INSERT INTO medicines (id, name, category, description, price, discount, stock, needs_prescription, manufacturer, dosage, image, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id, name, category, description || '', Number(price), discountVal, Number(stock), 
        np, manufacturer || '', dosage || '', image || '', expiryDate || ''
      ]
    );

    const resDb = await pool.query('SELECT * FROM medicines WHERE id = $1', [id]);
    res.status(201).json(formatMedicine(resDb.rows[0]));
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a medicine (including per-product discount)
// @route   PUT /api/medicines/:id
// @access  Private/Admin
export const updateMedicine = async (req, res) => {
  const { name, category, description, price, discount, stock, needsPrescription, manufacturer, dosage, image, expiryDate } = req.body;

  try {
    const medRes = await pool.query('SELECT * FROM medicines WHERE id = $1', [req.params.id]);
    if (medRes.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const medicine = medRes.rows[0];

    // Handle discount: keep existing if not provided
    let discountVal = medicine.discount !== undefined ? Number(medicine.discount) : 0;
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
        : medicine.needs_prescription,
      manufacturer: manufacturer !== undefined ? manufacturer : medicine.manufacturer,
      dosage: dosage !== undefined ? dosage : medicine.dosage,
      image: image !== undefined ? image : medicine.image,
      expiryDate: expiryDate !== undefined ? expiryDate : medicine.expiry_date
    };

    await pool.query(
      `UPDATE medicines SET name=$1, category=$2, description=$3, price=$4, discount=$5, stock=$6, needs_prescription=$7, manufacturer=$8, dosage=$9, image=$10, expiry_date=$11, updated_at=CURRENT_TIMESTAMP WHERE id=$12`,
      [
        updatedData.name, updatedData.category, updatedData.description, updatedData.price,
        updatedData.discount, updatedData.stock, updatedData.needsPrescription,
        updatedData.manufacturer, updatedData.dosage, updatedData.image, updatedData.expiryDate,
        req.params.id
      ]
    );

    const resDb = await pool.query('SELECT * FROM medicines WHERE id = $1', [req.params.id]);
    res.json(formatMedicine(resDb.rows[0]));
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
    const medRes = await pool.query('SELECT * FROM medicines WHERE id = $1', [req.params.id]);
    if (medRes.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    await pool.query('DELETE FROM medicines WHERE id = $1', [req.params.id]);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
