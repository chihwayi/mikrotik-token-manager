import dotenv from 'dotenv';
import pool from '../src/config/database.js';
import Router from '../src/models/Router.js';
import TokenPackage from '../src/models/TokenPackage.js';
import User from '../src/models/User.js';
import mikrotikService from '../src/services/mikrotikService.js';
import tokenService from '../src/services/tokenService.js';
import routerService from '../src/services/routerService.js';

dotenv.config();

/**
 * Test script for MikroTik RouterOS API integration
 * Tests connection, router info, and token generation with mock router
 */

async function testMikroTikIntegration() {
  console.log('\n🧪 MikroTik RouterOS Integration Test\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Test Router Connection
    console.log('\n📡 Step 1: Testing Router Connection...');
    console.log('─'.repeat(60));
    
    const mockRouterIP = process.env.MOCK_ROUTER_IP || 'mock-routeros';
    const mockRouterPort = parseInt(process.env.MOCK_ROUTEROS_PORT || '8728');
    
    console.log(`   Connecting to: ${mockRouterIP}:${mockRouterPort}`);
    console.log(`   Username: admin`);
    console.log(`   Password: admin`);
    
    // Create test router entry
    const testRouterData = {
      name: 'Test Mock Router',
      location: 'Test Lab',
      ip_address: mockRouterIP,
      api_port: mockRouterPort,
      api_username: 'admin',
      apiPassword: 'admin', // Mock router accepts any password
      province: 'Harare',
      district: 'Harare',
      town: 'Harare'
    };

    // Test connection first
    console.log('\n   Testing connection...');
    const connectionTest = await routerService.testRouterConnection(testRouterData);
    
    if (!connectionTest.success) {
      console.error('   ❌ Connection test failed:', connectionTest.message);
      console.error('\n   💡 Make sure the mock-routeros service is running:');
      console.error('      docker-compose up mock-routeros');
      process.exit(1);
    }
    
    console.log('   ✅ Connection successful!');

    // Step 2: Add Router to Database
    console.log('\n💾 Step 2: Adding Router to Database...');
    console.log('─'.repeat(60));
    
    let router;
    try {
      router = await routerService.addRouter(testRouterData);
      console.log(`   ✅ Router added: ${router.name} (ID: ${router.id})`);
      console.log(`   📍 IP: ${router.ip_address}:${router.api_port}`);
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        // Try to find existing router
        const routers = await Router.findAll();
        router = routers.find(r => r.ip_address === mockRouterIP);
        if (router) {
          console.log(`   ℹ️  Router already exists: ${router.name} (ID: ${router.id})`);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Step 3: Get Router Info
    console.log('\n📊 Step 3: Fetching Router Information...');
    console.log('─'.repeat(60));
    
    try {
      const routerInfo = await mikrotikService.getRouterInfo(router.id);
      console.log('   ✅ Router Info:');
      console.log(`      Identity: ${routerInfo.identity}`);
      console.log(`      Model: ${routerInfo.model}`);
      console.log(`      Serial: ${routerInfo.serialNumber}`);
      console.log(`      Firmware: ${routerInfo.firmware}`);
      console.log(`      CPU: ${routerInfo.cpu}%`);
      console.log(`      Uptime: ${routerInfo.uptime}`);
    } catch (error) {
      console.error('   ⚠️  Could not fetch router info:', error.message);
    }

    // Step 4: Test Router Statistics
    console.log('\n📈 Step 4: Fetching Router Statistics...');
    console.log('─'.repeat(60));
    
    try {
      const stats = await mikrotikService.getRouterStats(router.id);
      console.log('   ✅ Router Stats:');
      console.log(`      CPU: ${stats.cpu}%`);
      console.log(`      Memory: ${stats.memory.used} / ${stats.memory.total} (${stats.memory.usagePercent}%)`);
      console.log(`      Active Users: ${stats.activeUsers}`);
      console.log(`      Uptime: ${stats.uptime}`);
      console.log(`      Board: ${stats.boardName}`);
    } catch (error) {
      console.error('   ⚠️  Could not fetch router stats:', error.message);
    }

    // Step 5: Create Test Package
    console.log('\n📦 Step 5: Creating Test Package...');
    console.log('─'.repeat(60));
    
    let testPackage;
    try {
      testPackage = await TokenPackage.create({
        name: 'Test 1 Hour Package',
        durationHours: 1,
        dataLimitMb: 500,
        price: 1.00,
        description: 'Test package for MikroTik integration',
        active: true
      });
      console.log(`   ✅ Package created: ${testPackage.name} (ID: ${testPackage.id})`);
      console.log(`      Duration: ${testPackage.duration_hours}h`);
      console.log(`      Data Limit: ${testPackage.data_limit_mb}MB`);
      console.log(`      Price: $${testPackage.price}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        const packages = await TokenPackage.findAll();
        testPackage = packages.find(p => p.name === 'Test 1 Hour Package');
        if (testPackage) {
          console.log(`   ℹ️  Package already exists: ${testPackage.name} (ID: ${testPackage.id})`);
        }
      } else {
        throw error;
      }
    }

    // Step 6: Create Test Staff User
    console.log('\n👤 Step 6: Setting Up Test Staff User...');
    console.log('─'.repeat(60));
    
    let staffUser;
    try {
      // Try to find existing staff user or create one
      const users = await User.findAll();
      staffUser = users.find(u => u.role === 'staff');
      
      if (!staffUser) {
        staffUser = await User.create({
          email: 'test-staff@mikrotik.local',
          password: 'test123456', // Will be hashed
          role: 'staff',
          assignedRouterId: router.id
        });
        console.log(`   ✅ Staff user created: ${staffUser.email}`);
      } else {
        // Assign router if not already assigned
        if (!staffUser.assigned_router_id) {
          await User.update(staffUser.id, { assignedRouterId: router.id });
          console.log(`   ✅ Router assigned to existing staff: ${staffUser.email}`);
        } else {
          console.log(`   ℹ️  Using existing staff user: ${staffUser.email}`);
        }
        // Refresh to get updated data
        staffUser = await User.findById(staffUser.id);
      }
    } catch (error) {
      console.error('   ⚠️  Error setting up staff user:', error.message);
      throw error;
    }

    // Step 7: Test Token Generation
    console.log('\n🎫 Step 7: Testing Token Generation...');
    console.log('─'.repeat(60));
    
    try {
      console.log(`   Generating token for staff: ${staffUser.email}`);
      console.log(`   Package: ${testPackage.name}`);
      console.log(`   Router: ${router.name}`);
      
      const tokenResult = await tokenService.generateToken(
        staffUser.id,
        testPackage.id,
        router.id
      );
      
      console.log('   ✅ Token generated successfully!');
      console.log(`      Voucher Code: ${tokenResult.voucher_code}`);
      console.log(`      Password: ${tokenResult.voucher_code}`);
      console.log(`      Duration: ${tokenResult.duration_hours}h`);
      console.log(`      Data Limit: ${tokenResult.data_limit_mb}MB`);
      console.log(`      Expected Revenue: $${tokenResult.expected_revenue}`);
      console.log(`      Transaction ID: ${tokenResult.transaction_id}`);
    } catch (error) {
      console.error('   ❌ Token generation failed:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }

    // Step 8: Verify Token on Router
    console.log('\n🔍 Step 8: Verifying Token on Router...');
    console.log('─'.repeat(60));
    
    try {
      const users = await mikrotikService.getAllHotspotUsers(router.id);
      console.log(`   ✅ Found ${users.length} hotspot user(s) on router:`);
      users.forEach((user, index) => {
        console.log(`      ${index + 1}. Username: ${user.username}`);
        console.log(`         Profile: ${user.profile}`);
        console.log(`         Uptime Limit: ${user.limitUptime}`);
        console.log(`         Data Limit: ${user.limitBytes}`);
      });
    } catch (error) {
      console.error('   ⚠️  Could not verify users on router:', error.message);
    }

    // Step 9: Test Active Users
    console.log('\n👥 Step 9: Checking Active Users...');
    console.log('─'.repeat(60));
    
    try {
      const activeUsers = await mikrotikService.getActiveUsers(router.id);
      console.log(`   ✅ Active Users: ${activeUsers.length}`);
      activeUsers.forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.username}`);
        console.log(`         IP: ${user.ipAddress}`);
        console.log(`         MAC: ${user.macAddress}`);
        console.log(`         Uptime: ${user.uptime}`);
      });
    } catch (error) {
      console.error('   ⚠️  Could not fetch active users:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Integration Test Completed Successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   Router: ${router.name} (${router.ip_address}:${router.api_port})`);
    console.log(`   Package: ${testPackage.name}`);
    console.log(`   Staff: ${staffUser.email}`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Test token generation from Staff Dashboard');
    console.log('   2. Monitor router statistics');
    console.log('   3. Test with real MikroTik router using same process');
    console.log('\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Integration Test Failed!');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\nStack:', error.stack);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure mock-routeros service is running:');
    console.error('      docker-compose ps mock-routeros');
    console.error('   2. Check if port 8728 is accessible:');
    console.error('      docker-compose logs mock-routeros');
    console.error('   3. Verify database connection:');
    console.error('      docker-compose ps postgres');
    console.error('\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run test
testMikroTikIntegration();


