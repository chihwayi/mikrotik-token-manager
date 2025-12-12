import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Load user credentials from environment variables
// Copy this file to seed-users.js and set the following in your .env:
//
// SEED_ADMIN_EMAIL=admin@mikrotik.local
// SEED_ADMIN_PASSWORD=YourSecurePassword123!
// SEED_MANAGER_EMAIL=manager@mikrotik.local
// SEED_MANAGER_PASSWORD=YourSecurePassword123!
// SEED_STAFF_EMAIL=staff@mikrotik.local
// SEED_STAFF_PASSWORD=YourSecurePassword123!
//
// NEVER commit seed-users.js to git - it's in .gitignore for security

const users = [
  {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@mikrotik.local',
    password: process.env.SEED_ADMIN_PASSWORD || '',
    role: 'super_admin',
    assignedRouterId: null
  },
  {
    email: process.env.SEED_MANAGER_EMAIL || 'manager@mikrotik.local',
    password: process.env.SEED_MANAGER_PASSWORD || '',
    role: 'manager',
    assignedRouterId: null
  },
  {
    email: process.env.SEED_STAFF_EMAIL || 'staff@mikrotik.local',
    password: process.env.SEED_STAFF_PASSWORD || '',
    role: 'staff',
    assignedRouterId: null // Will be assigned after router is added
  }
];

async function seedUsers() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding users...\n');
    
    // Validate that passwords are provided
    for (const userData of users) {
      if (!userData.password || userData.password.trim() === '') {
        console.error(`❌ Error: Password not provided for ${userData.email}`);
        console.error(`   Please set the corresponding environment variable in your .env file`);
        throw new Error(`Missing password for user: ${userData.email}`);
      }
    }
    
    for (const userData of users) {
      // Check if user already exists
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );
      
      if (existing.rows.length > 0) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      // Insert user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, role, assigned_router_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, role`,
        [userData.email, passwordHash, userData.role, userData.assignedRouterId]
      );
      
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }
    
    await client.query('COMMIT');
    
    console.log('\n✨ User seeding completed!\n');
    console.log('📋 Seeded Users:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const userData of users) {
      console.log(`${userData.role}: ${userData.email}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  Passwords are stored securely and not displayed here.');
    console.log('   They are defined in your .env file.\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedUsers()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

