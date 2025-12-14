# Mock MikroTik RouterOS API Server

A standalone mock server that simulates MikroTik RouterOS API for testing the MikroTik Token Manager application without requiring actual hardware.

## Features

- ✅ Simulates RouterOS API protocol
- ✅ Hotspot user management (add/remove/list)
- ✅ Active session tracking
- ✅ Router statistics (CPU, memory, uptime)
- ✅ Router information (model, identity, firmware)
- ✅ Profile management
- ✅ No dependencies on actual MikroTik hardware

## Quick Start

### Option 1: Standalone (Recommended)

```bash
cd mock-routeros
npm install
npm start
```

### Option 2: Docker

Add to your `docker-compose.yml`:

```yaml
mock-routeros:
  build:
    context: ./mock-routeros
    dockerfile: Dockerfile
  ports:
    - "8728:8728"
  networks:
    - mikrotik_network
```

## Usage

1. **Start the mock server:**
   ```bash
   cd mock-routeros
   npm start
   ```

2. **Add router to your application:**
   - Go to Super Admin Dashboard → Routers
   - Click "Add Router"
   - Enter:
     - **Name**: Mock Router
     - **Location**: Test Lab
     - **IP Address**: `localhost` (or `mock-routeros` if using Docker)
     - **API Port**: `8728`
     - **Username**: `admin`
     - **Password**: `admin`

3. **Test token generation:**
   - Login as Staff
   - Select a package
   - Generate token
   - Token will be added to mock router
   - Check mock server console for confirmation

## Default Credentials

- **Username**: `admin` (or any)
- **Password**: `admin` (or any)

The mock server accepts any credentials for testing purposes.

## API Endpoints Simulated

- `/ip/hotspot/user/add` - Add hotspot user
- `/ip/hotspot/user/print` - List hotspot users
- `/ip/hotspot/user/remove` - Remove hotspot user
- `/ip/hotspot/active/print` - List active sessions
- `/ip/hotspot/user/profile/add` - Create profile
- `/ip/hotspot/user/profile/print` - List profiles
- `/system/resource/print` - Get router stats
- `/system/identity/print` - Get router identity
- `/system/routerboard/print` - Get router board info

## Configuration

Set environment variables:

- `MOCK_ROUTEROS_PORT` - Port to listen on (default: 8728)

## Testing Scenarios

### Test Token Generation
1. Start mock server
2. Add router with IP `localhost:8728`
3. Generate token as staff
4. Check mock server console - should show user added
5. View active users - token should appear

### Test Router Stats
1. Add router
2. Go to router stats endpoint
3. Should return CPU, memory, uptime data

### Test Multiple Routers
1. Start multiple mock servers on different ports
2. Add each as separate router
3. Generate tokens for different routers
4. Each router maintains separate user list

## Troubleshooting

**Port already in use:**
```bash
# Use different port
MOCK_ROUTEROS_PORT=8729 npm start
```

**Connection refused:**
- Make sure mock server is running
- Check firewall settings
- Verify IP address is correct

**Users not appearing:**
- Check mock server console for errors
- Verify router credentials
- Check network connectivity

## Integration with Docker Compose

Add to your `docker-compose.yml`:

```yaml
mock-routeros:
  build: ./mock-routeros
  ports:
    - "8728:8728"
  networks:
    - mikrotik_network
  environment:
    - MOCK_ROUTEROS_PORT=8728
```

Then update router IP to `mock-routeros` instead of `localhost`.

## Notes

- Mock server stores data in memory (resets on restart)
- Simulates realistic RouterOS API responses
- Perfect for development and testing
- No actual router hardware needed



