const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const app = require('../index');

let mongoServer;
let server;

beforeAll(async () => {
  // Start the in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect Mongoose to the in-memory server
  await mongoose.connect(mongoUri);

  // Start the Express server
  server = app.listen();

  // Create a test user
  const testUser = new User({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123',
    role: 'User',
    status: 'Active'
  });
  await testUser.save();
});

afterAll(async () => {
  // Clean up and disconnect
  await mongoose.connection.close();
  await mongoServer.stop();
  server.close();
});

describe('Auth Endpoints', () => {
  it('should login an existing user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
    
    expect(res.statusCode).toEqual(401);
  });
});