import RouterOSAPI from 'node-routeros';

/**
 * Test script to verify mock RouterOS server works
 */

async function testConnection() {
  console.log('Testing connection to Mock RouterOS Server...\n');

  try {
    const conn = new RouterOSAPI({
      host: 'localhost',
      user: 'admin',
      password: 'admin',
      port: 8728,
      timeout: 5
    });

    console.log('Connecting...');
    await conn.connect();
    console.log('✅ Connected successfully!\n');

    // Test system identity
    console.log('Testing /system/identity/print...');
    const identity = await conn.write('/system/identity/print');
    console.log('✅ Identity:', identity);
    console.log('');

    // Test system resources
    console.log('Testing /system/resource/print...');
    const resources = await conn.write('/system/resource/print');
    console.log('✅ Resources:', resources);
    console.log('');

    // Test hotspot user add
    console.log('Testing /ip/hotspot/user/add...');
    const testVoucher = 'TEST-' + Date.now().toString().slice(-6);
    await conn.write('/ip/hotspot/user/add', [
      `=name=${testVoucher}`,
      `=password=${testVoucher}`,
      '=limit-uptime=1h',
      '=limit-bytes-total=1048576',
      '=profile=default'
    ]);
    console.log(`✅ Hotspot user added: ${testVoucher}\n`);

    // Test hotspot user print
    console.log('Testing /ip/hotspot/user/print...');
    const users = await conn.write('/ip/hotspot/user/print');
    console.log(`✅ Found ${users.length} hotspot users`);
    users.forEach(u => console.log(`   - ${u.name} (${u.profile})`));
    console.log('');

    // Test active users
    console.log('Testing /ip/hotspot/active/print...');
    const active = await conn.write('/ip/hotspot/active/print');
    console.log(`✅ Found ${active.length} active sessions\n`);

    conn.close();
    console.log('✅ All tests passed! Mock server is working correctly.\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testConnection();

