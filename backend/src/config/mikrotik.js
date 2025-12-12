import dotenv from 'dotenv';

dotenv.config();

export default {
  // Default RouterOS API settings
  defaultPort: 8728,
  defaultTimeout: 10, // seconds
  connectionRetries: 3,
  retryDelay: 1000, // milliseconds
  
  // Hotspot profile settings
  defaultHotspotProfile: 'default',
  
  // Health check intervals
  healthCheckInterval: 300000, // 5 minutes in milliseconds
  
  // Sync intervals
  syncInterval: 60000, // 1 minute in milliseconds
  
  // RouterOS API command paths
  paths: {
    hotspot: {
      users: '/ip/hotspot/user',
      active: '/ip/hotspot/active',
      profiles: '/ip/hotspot/user/profile'
    },
    system: {
      resources: '/system/resource',
      identity: '/system/identity',
      routerboard: '/system/routerboard'
    },
    interface: {
      list: '/interface/print'
    }
  }
};

