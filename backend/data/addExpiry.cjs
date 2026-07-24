const fs = require('fs');
const path = 'e:/chinmaya-medicals/backend/data/medicines.json';
const meds = JSON.parse(fs.readFileSync(path, 'utf8'));
meds.forEach(m => {
  if (!m.expiryDate) {
    const year = 2026 + Math.floor(Math.random() * 4);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    m.expiryDate = `${year}-${month}`;
  }
});
fs.writeFileSync(path, JSON.stringify(meds, null, 2));
console.log('Added expiryDate to all medicines');
