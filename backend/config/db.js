import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
const initializeDB = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating database directory:', error);
  }
};

class FileCollection {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    this.data = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await initializeDB();
    try {
      const fileExists = await fs.access(this.filePath).then(() => true).catch(() => false);
      if (fileExists) {
        const content = await fs.readFile(this.filePath, 'utf-8');
        this.data = JSON.parse(content || '[]');
      } else {
        await fs.writeFile(this.filePath, '[]', 'utf-8');
        this.data = [];
      }
    } catch (error) {
      console.error(`Error loading database file ${this.filePath}:`, error);
      this.data = [];
    }
    this.initialized = true;
  }

  async save() {
    await this.init();
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error saving database file ${this.filePath}:`, error);
    }
  }

  async find(query = {}) {
    await this.init();
    return this.data.filter(item => {
      for (const key in query) {
        // Support regular expression querying for search fields
        if (query[key] && typeof query[key] === 'object' && query[key].$regex) {
          const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
          if (!regex.test(item[key] || '')) return false;
          continue;
        }
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results[0] || null;
  }

  async findById(id) {
    await this.init();
    return this.data.find(item => String(item._id) === String(id)) || null;
  }

  async create(newItem) {
    await this.init();
    const doc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newItem
    };
    this.data.push(doc);
    await this.save();
    return doc;
  }

  async findByIdAndUpdate(id, updateData) {
    await this.init();
    const index = this.data.findIndex(item => String(item._id) === String(id));
    if (index === -1) return null;

    const currentItem = this.data[index];
    const updatedItem = {
      ...currentItem,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.data[index] = updatedItem;
    await this.save();
    return updatedItem;
  }

  async findByIdAndDelete(id) {
    await this.init();
    const index = this.data.findIndex(item => String(item._id) === String(id));
    if (index === -1) return false;
    this.data.splice(index, 1);
    await this.save();
    return true;
  }
}

export const Users = new FileCollection('users');
export const Medicines = new FileCollection('medicines');
export const Carts = new FileCollection('carts');
export const Orders = new FileCollection('orders');
