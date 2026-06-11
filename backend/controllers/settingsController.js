import { Settings } from '../config/db.js';

// Get settings
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if they don't exist
      settings = await Settings.create({
        discountPercentage: 15
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update settings (Admin only)
export const updateSettings = async (req, res) => {
  const { discountPercentage } = req.body;

  if (discountPercentage === undefined || isNaN(discountPercentage)) {
    return res.status(400).json({ message: 'Please provide a valid discount percentage' });
  }

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        discountPercentage: Number(discountPercentage)
      });
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, {
        discountPercentage: Number(discountPercentage)
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
