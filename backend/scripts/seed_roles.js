// Seed script to create sample users with different roles
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Moderator User',
    email: 'moderator@example.com',
    password: 'mod123',
    role: 'moderator'
  },
  {
    name: 'Regular User',
    email: 'user@example.com',
    password: 'user123',
    role: 'user'
  },
  {
    name: 'Student 1',
    email: 'student1@example.com',
    password: 'password123',
    role: 'user'
  },
  {
    name: 'Student 2 (Mod)',
    email: 'student2@example.com',
    password: 'password123',
    role: 'moderator'
  }
];

async function seedRoles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    for (const userData of sampleUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = await User.create(userData);
      console.log(`✅ Created ${user.role}: ${user.email}`);
    }

    console.log('\n📊 Summary:');
    const adminCount = await User.countDocuments({ role: 'admin' });
    const modCount = await User.countDocuments({ role: 'moderator' });
    const userCount = await User.countDocuments({ role: 'user' });
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Moderators: ${modCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Total: ${adminCount + modCount + userCount}`);

    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Moderator: moderator@example.com / mod123');
    console.log('   User: user@example.com / user123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seedRoles();
