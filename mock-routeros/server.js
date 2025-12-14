import net from 'net';
import crypto from 'crypto';

/**
 * Mock MikroTik RouterOS API Server
 * Simulates RouterOS API for testing without actual hardware
 * Implements RouterOS API binary protocol
 */

class MockRouterOSServer {
  constructor(port = 8728) {
    this.port = port;
    this.server = null;
    this.hotspotUsers = new Map();
    this.activeSessions = new Map();
    this.routerInfo = {
      identity: 'MockRouterOS',
      model: 'RB750Gr3',
      'serial-number': 'MOCK-12345678',
      'current-firmware': '6.49.7',
      version: '6.49.7'
    };
    this.stats = {
      cpu: 15.5,
      'total-memory': 262144000,
      'free-memory': 196608000,
      uptime: '5d 12h 30m 15s',
      'board-name': 'RB750Gr3'
    };
    this.profiles = new Map();
    this.profiles.set('default', { name: 'default', 'shared-users': '1' });
  }

  start() {
    this.server = net.createServer((socket) => {
      console.log(`[MockRouterOS] ✅ Client connected from ${socket.remoteAddress || 'unknown'}`);
      
      let authenticated = false;
      let username = null;
      let buffer = Buffer.alloc(0);
      let challenge = null;
      let expectingChallenge = true;

      // RouterOS API: Send challenge on connection
      // Generate random challenge (8 bytes) - hex string
      challenge = crypto.randomBytes(8);
      const challengeHex = challenge.toString('hex');
      console.log(`[MockRouterOS] 🔐 Generated challenge: ${challengeHex}`);
      
      // Send challenge immediately after connection (synchronously)
      // RouterOS API format: !done =ret=challenge_hex_string
      try {
        const challengeMsg = this.createMessage(['!done', `=ret=${challengeHex}`]);
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32BE(challengeMsg.length, 0);
        const fullMessage = Buffer.concat([lengthBuffer, challengeMsg]);
        socket.write(fullMessage);
        console.log(`[MockRouterOS] 📤 Challenge sent to client (${fullMessage.length} bytes)`);
        expectingChallenge = false;
      } catch (err) {
        console.log(`[MockRouterOS] ⚠️  Error sending challenge: ${err.message}`);
      }

      socket.on('data', (data) => {
        console.log(`[MockRouterOS] 📥 Received ${data.length} bytes`);
        buffer = Buffer.concat([buffer, data]);
        
        // RouterOS API uses length-prefixed messages (4 bytes big-endian)
        while (buffer.length >= 4) {
          const length = buffer.readUInt32BE(0);
          console.log(`[MockRouterOS] 📏 Message length: ${length} bytes (buffer has ${buffer.length} bytes)`);
          
          if (length === 0) {
            // Empty message, skip
            buffer = buffer.slice(4);
            continue;
          }
          
          if (buffer.length < 4 + length) {
            // Not enough data yet, wait for more
            console.log(`[MockRouterOS] ⏳ Waiting for more data (need ${4 + length}, have ${buffer.length})`);
            break;
          }
          
          const messageBuffer = buffer.slice(4, 4 + length);
          buffer = buffer.slice(4 + length);
          
          console.log(`[MockRouterOS] 📨 Processing message (${messageBuffer.length} bytes)`);
          this.handleMessage(socket, messageBuffer, challenge, () => authenticated, (auth) => {
            authenticated = auth;
            if (auth) username = 'authenticated';
          });
        }
      });

      socket.on('error', (err) => {
        console.log(`[MockRouterOS] ⚠️  Socket error: ${err.message}`);
      });

      socket.on('close', () => {
        console.log(`[MockRouterOS] 🔌 Client disconnected`);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`\n🚀 Mock MikroTik RouterOS API Server Started`);
      console.log(`📡 Listening on port ${this.port}`);
      console.log(`🔗 Connect using: IP=localhost, Port=${this.port}`);
      console.log(`👤 Default credentials: admin / admin (or any)`);
      console.log(`\n💡 Use this for testing your MikroTik Token Manager\n`);
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${this.port} is already in use`);
        console.log(`💡 Try: MOCK_ROUTEROS_PORT=8729 npm start`);
      } else {
        console.error(`❌ Server error: ${err.message}`);
      }
    });
  }

  // Parse RouterOS API message (words are length-prefixed)
  parseMessage(buffer) {
    const words = [];
    let offset = 0;
    
    while (offset < buffer.length) {
      if (offset + 4 > buffer.length) break;
      
      const wordLength = buffer.readUInt32BE(offset);
      offset += 4;
      
      if (offset + wordLength > buffer.length) break;
      
      const word = buffer.slice(offset, offset + wordLength).toString('utf8');
      words.push(word);
      offset += wordLength;
    }
    
    return words;
  }

  // Create RouterOS API message (length-prefixed words)
  createMessage(words) {
    let buffer = Buffer.alloc(0);
    
    for (const word of words) {
      const wordBuffer = Buffer.from(word, 'utf8');
      const lengthBuffer = Buffer.alloc(4);
      lengthBuffer.writeUInt32BE(wordBuffer.length, 0);
      buffer = Buffer.concat([buffer, lengthBuffer, wordBuffer]);
    }
    
    return buffer;
  }

  handleMessage(socket, messageBuffer, challenge, isAuthenticated, setAuth) {
    const words = this.parseMessage(messageBuffer);
    if (words.length === 0) return;

    const command = words[0];
    const params = {};
    
    // Parse parameters (key=value pairs)
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      if (word.startsWith('=')) {
        const [key, value] = word.substring(1).split('=', 2);
        params[key] = value || '';
      } else if (word.includes('=')) {
        const [key, value] = word.split('=', 2);
        params[key] = value || '';
      } else {
        params[word] = true;
      }
    }

    // Login command
    if (command === '/login') {
      const username = params.name || '';
      const response = params.response || '';
      const password = params.password || '';
      
      console.log(`[MockRouterOS] 🔐 Login attempt: username=${username}, has_response=${!!response}, has_password=${!!password}`);
      
      // RouterOS API supports two methods:
      // 1. Challenge-response (older): MD5(00 + password + challenge)
      // 2. Plaintext (v6.43+): plain password
      // For testing, we accept either method
      
      if (!username) {
        console.log(`[MockRouterOS] ❌ Login failed: missing username`);
        this.sendReply(socket, ['!fatal', 'invalid username']);
        return;
      }
      
      // Accept authentication (for testing, we don't validate the hash)
      // In real RouterOS: validate MD5(challenge + password) === response (if using challenge-response)
      // Or validate password directly (if using plaintext method)
      setAuth(true);
      this.sendReply(socket, ['!done']);
      console.log(`[MockRouterOS] ✅ User authenticated: ${username} (method: ${response ? 'challenge-response' : 'plaintext'})`);
      return;
    }

    // Check authentication for other commands
    if (!isAuthenticated()) {
      this.sendReply(socket, ['!fatal', 'not logged in']);
      return;
    }

    // Handle RouterOS commands
    if (command === '/ip/hotspot/user/print') {
      this.handleHotspotUserPrint(socket, params);
    } else if (command === '/ip/hotspot/user/add') {
      this.handleHotspotUserAdd(socket, params);
    } else if (command === '/ip/hotspot/user/remove') {
      this.handleHotspotUserRemove(socket, params);
    } else if (command === '/ip/hotspot/active/print') {
      this.handleHotspotActivePrint(socket);
    } else if (command === '/ip/hotspot/user/profile/print') {
      this.handleProfilePrint(socket);
    } else if (command === '/ip/hotspot/user/profile/add') {
      this.handleProfileAdd(socket, params);
    } else if (command === '/system/resource/print') {
      this.handleSystemResource(socket);
    } else if (command === '/system/identity/print') {
      this.handleSystemIdentity(socket);
    } else if (command === '/system/routerboard/print') {
      this.handleRouterBoard(socket);
    } else {
      // Unknown command - return empty result
      console.log(`[MockRouterOS] ⚠️  Unknown command: ${command}`);
      this.sendReply(socket, ['!done']);
    }
  }

  handleHotspotUserPrint(socket, params) {
    const results = [];
    
    for (const [username, user] of this.hotspotUsers.entries()) {
      if (params['?name'] && params['?name'] !== username) continue;
      
      const result = {
        '.id': user.id,
        '=name': username,
        '=password': username,
        '=profile': user.profile || 'default',
        '=limit-uptime': user['limit-uptime'] || 'unlimited',
        '=limit-bytes-total': user['limit-bytes-total'] || 'unlimited',
        '=uptime': user.uptime || '0s',
        '=bytes': user.bytes || '0'
      };
      
      results.push(result);
    }
    
    this.sendReplies(socket, results);
  }

  handleHotspotUserAdd(socket, params) {
    const username = params.name || '';
    
    if (!username) {
      this.sendReply(socket, ['!trap', 'invalid username']);
      return;
    }

    const user = {
      id: `*${crypto.randomBytes(4).toString('hex')}`,
      name: username,
      password: params.password || username,
      profile: params.profile || 'default',
      'limit-uptime': params['limit-uptime'] || 'unlimited',
      'limit-bytes-total': params['limit-bytes-total'] || 'unlimited',
      uptime: '0s',
      bytes: '0',
      created: new Date()
    };

    this.hotspotUsers.set(username, user);
    
    // Simulate active session if limits are set
    if (user['limit-uptime'] !== 'unlimited' || user['limit-bytes-total'] !== 'unlimited') {
      this.activeSessions.set(username, {
        user: username,
        'mac-address': this.generateMAC(),
        address: this.generateIP(),
        uptime: '0s',
        'bytes-in': '0',
        'bytes-out': '0'
      });
    }

    console.log(`[MockRouterOS] ✅ Hotspot user added: ${username}`);
    console.log(`   Profile: ${user.profile}, Uptime: ${user['limit-uptime']}, Data: ${user['limit-bytes-total']}`);
    
    this.sendReply(socket, ['!done', `=ret=${user.id}`]);
  }

  handleHotspotUserRemove(socket, params) {
    const id = params['.id'] || '';
    
    if (id) {
      for (const [username, user] of this.hotspotUsers.entries()) {
        if (user.id === id) {
          this.hotspotUsers.delete(username);
          this.activeSessions.delete(username);
          console.log(`[MockRouterOS] 🗑️  Hotspot user removed: ${username}`);
          this.sendReply(socket, ['!done']);
          return;
        }
      }
    }
    
    this.sendReply(socket, ['!trap', 'user not found']);
  }

  handleHotspotActivePrint(socket) {
    const results = [];
    for (const [username, session] of this.activeSessions.entries()) {
      results.push({
        '=user': username,
        '=mac-address': session['mac-address'],
        '=address': session.address,
        '=uptime': session.uptime,
        '=bytes-in': session['bytes-in'],
        '=bytes-out': session['bytes-out']
      });
    }
    this.sendReplies(socket, results);
  }

  handleProfilePrint(socket) {
    const results = [];
    for (const [name, profile] of this.profiles.entries()) {
      results.push({
        '=name': name,
        '=shared-users': profile['shared-users'] || '1'
      });
    }
    this.sendReplies(socket, results);
  }

  handleProfileAdd(socket, params) {
    const name = params.name || 'default';
    
    this.profiles.set(name, {
      name: name,
      'shared-users': params['shared-users'] || '1'
    });
    
    console.log(`[MockRouterOS] ✅ Profile created: ${name}`);
    this.sendReply(socket, ['!done']);
  }

  handleSystemResource(socket) {
    // Simulate some variation in stats
    const stats = {
      '=cpu': (Math.random() * 30 + 10).toFixed(1),
      '=total-memory': this.stats['total-memory'].toString(),
      '=free-memory': Math.floor(Math.random() * 50000000 + 150000000).toString(),
      '=uptime': this.stats.uptime,
      '=board-name': this.stats['board-name']
    };
    
    this.sendReplies(socket, [stats]);
  }

  handleSystemIdentity(socket) {
    this.sendReplies(socket, [{'=name': this.routerInfo.identity}]);
  }

  handleRouterBoard(socket) {
    this.sendReplies(socket, [{
      '=model': this.routerInfo.model,
      '=serial-number': this.routerInfo['serial-number'],
      '=current-firmware': this.routerInfo['current-firmware']
    }]);
  }

  sendReply(socket, words) {
    const message = this.createMessage(words);
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(message.length, 0);
    socket.write(Buffer.concat([lengthBuffer, message]));
  }

  sendReplies(socket, items) {
    for (const item of items) {
      const words = ['!re'];
      for (const [key, value] of Object.entries(item)) {
        words.push(`${key}=${value}`);
      }
      this.sendReply(socket, words);
    }
    this.sendReply(socket, ['!done']);
  }

  generateMAC() {
    return Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':');
  }

  generateIP() {
    return `192.168.88.${Math.floor(Math.random() * 254) + 1}`;
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('\n[MockRouterOS] Server stopped');
    }
  }
}

// Start server
const port = parseInt(process.env.MOCK_ROUTEROS_PORT || '8728');
const server = new MockRouterOSServer(port);
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[MockRouterOS] Shutting down...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});
