import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import User from '../models/user.model';
import Categorie from '../models/categorie.model';
import CategorieRevenu from '../models/categorieRevenu.model';
import Depense from '../models/depense.model';
import Revenu from '../models/revenu.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    // Set up required environment variables for testing
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
    process.env.NODE_ENV = 'test';
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    console.log('✅ In-memory MongoDB server started for tests');
  } catch (error) {
    console.error('❌ Error starting in-memory MongoDB server:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('✅ In-memory MongoDB server stopped');
  } catch (error) {
    console.error('❌ Error stopping in-memory MongoDB server:', error);
    throw error;
  }
});

beforeEach(async () => {
  try {
    await User.deleteMany({});
    await Categorie.deleteMany({});
    await CategorieRevenu.deleteMany({});
    await Depense.deleteMany({});
    await Revenu.deleteMany({});
    
    console.log('🧹 All collections cleared for test isolation');
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('🗑️  Test database dropped after test');
    }
  } catch (error) {
    console.error('❌ Error dropping test database:', error);
    throw error;
  }
}); 