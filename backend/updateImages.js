import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'data', 'medicines.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

data.forEach(m => {
  // Use a nice placeholder with the medicine's initials or name
  const nameParts = m.name.split(' ');
  const initials = nameParts.length > 1 ? nameParts[0][0] + nameParts[1][0] : nameParts[0][0];
  m.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=512`;
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Images updated with placeholders successfully!');
