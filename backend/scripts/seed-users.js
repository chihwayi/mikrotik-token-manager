import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const users = [
  {
    email: 'admin@mikrotik.local',
    password: 'Admin123!',
    role: 'super_admin',
    assignedRouterId: null
  },
  {
    email: 'manager@mikrotik.local',
    password: 'Manager123!',
    role: 'manager',
    assignedRouterId: null
  },
  {
    email: 'staff@mikrotik.local',
    password: 'Staff123!',
    role: 'staff',
    assignedRouterId: null // Will be assigned after router is added
  }
];

async function seedUsers() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding users...\n');
    
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
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Email:    admin@mikrotik.local');
    console.log('  Password: Admin123!');
    console.log('');
    console.log('Manager:');
    console.log('  Email:    manager@mikrotik.local');
    console.log('  Password: Manager123!');
    console.log('');
    console.log('Staff:');
    console.log('  Email:    staff@mikrotik.local');
    console.log('  Password: Staff123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
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

