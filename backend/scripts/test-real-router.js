import { RouterOSAPI } from 'node-routeros';

const ROUTER_IP = process.argv[2] || '192.168.88.1';
const ROUTER_USER = process.argv[3] || 'admin';
const ROUTER_PASS = process.argv[4] || 'Password123!';
const ROUTER_PORT = parseInt(process.argv[5] || '8728');

console.log(`\n🔌 Testing MikroTik Router Connection`);
console.log(`   IP: ${ROUTER_IP}`);
console.log(`   Port: ${ROUTER_PORT}`);
console.log(`   User: ${ROUTER_USER}`);
console.log(`   Password: ${ROUTER_PASS.substring(0, 4)}...\n`);

const connection = new RouterOSAPI({
  host: ROUTER_IP,
  user: ROUTER_USER,
  password: ROUTER_PASS,
  port: ROUTER_PORT,
  timeout: 10000
});

connection.connect()
  .then(() => {
    console.log('✅ Connected to router!\n');
    
    // Get router identity
    return connection.write('/system/identity/print');
  })
  .then((identity) => {
    console.log('📊 Router Identity:');
    console.log(`   Name: ${identity[0]?.name || 'Unknown'}\n`);
    
    // Get router board info
    return connection.write('/system/routerboard/print');
  })
  .then((routerboard) => {
    console.log('📦 Router Board Info:');
    console.log(`   Model: ${routerboard[0]?.model || 'Unknown'}`);
    console.log(`   Serial: ${routerboard[0]?.['serial-number'] || 'N/A'}`);
    console.log(`   Firmware: ${routerboard[0]?.['current-firmware'] || 'N/A'}\n`);
    
    // Get system resources
    return connection.write('/system/resource/print');
  })
  .then((resources) => {
    console.log('💻 System Resources:');
    console.log(`   CPU: ${resources[0]?.cpu || 'N/A'}%`);
    console.log(`   Memory: ${Math.round((resources[0]?.['total-memory'] || 0) / 1024 / 1024)}MB total`);
    console.log(`   Free Memory: ${Math.round((resources[0]?.['free-memory'] || 0) / 1024 / 1024)}MB`);
    console.log(`   Uptime: ${resources[0]?.uptime || 'N/A'}\n`);
    
    // Check if Hotspot is configured
    return connection.write('/ip/hotspot/user/print');
  })
  .then((hotspotUsers) => {
    console.log(`📡 Hotspot Users: ${hotspotUsers.length} users found\n`);
    
    // Check hotspot profiles
    return connection.write('/ip/hotspot/user/profile/print');
  })
  .then((profiles) => {
    console.log(`📋 Hotspot Profiles: ${profiles.length} profiles found`);
    profiles.forEach(profile => {
      console.log(`   - ${profile.name} (shared-users: ${profile['shared-users'] || '1'})`);
    });
    
    console.log('\n✅ Router is ready for token management!');
    console.log('   You can now register this router in the system.\n');
    
    connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solution: Enable RouterOS API service');
      console.error('   1. Open Winbox or WebFig');
      console.error('   2. Go to: IP → Services');
      console.error('   3. Enable "api" service');
      console.error('   4. Port should be 8728\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Solution: Check network connectivity');
      console.error('   - Make sure router is reachable from this machine');
      console.error('   - Try ping:', ROUTER_IP);
      console.error('   - Check firewall rules\n');
    } else if (error.message && error.message.includes('invalid user')) {
      console.error('\n💡 Solution: Check credentials');
      console.error('   - Verify username and password are correct');
      console.error('   - RouterOS v6.44.3 supports plaintext login\n');
    }
    
    connection.close();
    process.exit(1);
  });

