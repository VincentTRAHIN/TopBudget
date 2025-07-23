import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import User from '../models/user.model';
import Categorie from '../models/categorie.model';
import CategorieRevenu from '../models/categorieRevenu.model';
import Depense from '../models/depense.model';
import Revenu from '../models/revenu.model';

let mongoServer: MongoMemoryServer;

// Increase timeout for CI environments
const SETUP_TIMEOUT = process.env.CI ? 60000 : 30000;

beforeAll(async () => {
  try {
    // Set up required environment variables for testing
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-minimum-32-chars-long';
    process.env.NODE_ENV = 'test';
    process.env.API_BASE_URL = 'http://localhost:5001';
    
    // Configure MongoDB Memory Server for CI
    const mongoServerOptions = {
      binary: {
        skipMD5: true,
      },
      autoStart: false,
      instance: {
        port: undefined, // Let MongoDB Memory Server choose a port
        ip: '127.0.0.1',
        dbName: 'topbudget_test',
      },
    };

    console.log('🚀 Starting in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create(mongoServerOptions);
    const mongoUri = mongoServer.getUri();
    
    // Configure Mongoose for testing
    await mongoose.connect(mongoUri, {
      bufferCommands: false,
      bufferMaxEntries: 0,
    });
    
    console.log('✅ In-memory MongoDB server started for tests');
  } catch (error) {
    console.error('❌ Error starting in-memory MongoDB server:', error);
    throw error;
  }
}, SETUP_TIMEOUT);

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ In-memory MongoDB server stopped');
  } catch (error) {
    console.error('❌ Error stopping in-memory MongoDB server:', error);
    // Don't throw error in cleanup to avoid masking real test failures
  }
}, SETUP_TIMEOUT);

beforeEach(async () => {
  try {
    // Only clear if connection is active
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Categorie.deleteMany({});
      await CategorieRevenu.deleteMany({});
      await Depense.deleteMany({});
      await Revenu.deleteMany({});
      
      console.log('🧹 All collections cleared for test isolation');
    }
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    // Only drop if connection is active and database exists
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('🗑️  Test database dropped after test');
    }
  } catch (error) {
    console.error('❌ Error dropping test database:', error);
    // Don't throw error in cleanup to avoid masking real test failures
  }
}); 