const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('./src/models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding...');
    await User.deleteMany({});
    console.log('Existing users cleared.');

    const usersToCreate = [];
    
    // Create one guaranteed Admin user
    usersToCreate.push({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
      // Manually formatted phone number
      phoneNumber: `${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`,
      role: 'Admin',
      status: 'Active',
      profilePicture: faker.image.avatar(),
      address: {
        street: faker.location.street(),
        number: faker.location.buildingNumber(),
        city: faker.location.city(),
        postalCode: faker.location.zipCode(),
      }
    });

    // Create 49 other random users
    for (let i = 0; i < 49; i++) {
      usersToCreate.push({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
        // Manually formatted phone number
        phoneNumber: `${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`,
        role: faker.helpers.arrayElement(['User', 'Admin']),
        status: faker.helpers.arrayElement(['Active', 'Inactive']),
        profilePicture: faker.image.avatar(),
        address: {
          street: faker.location.street(),
          number: faker.location.buildingNumber(),
          city: faker.location.city(),
          postalCode: faker.location.zipCode(),
        }
      });
    }

    // Insert users one by one to trigger the hashing middleware
    for (const userData of usersToCreate) {
      const user = new User(userData);
      await user.save();
    }

    console.log('Database has been seeded with 50 users!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada.');
  }
};

seedDatabase();