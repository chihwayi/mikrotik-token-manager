import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Download } from 'lucide-react';

const VPNManager = () => {
  const [vpnPackages, setVpnPackages] = useState([]);
  const [routers, setRouters] = useState([]);
  const [selectedRouter, setSelectedRouter] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [vpnType, setVpnType] = useState('pptp');
  const [myVpnUsers, setMyVpnUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [vpnStats, setVpnStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVpnPackages();
    fetchRouters();
    fetchMyVpnUsers();
  }, []);

  useEffect(() => {
    if (selectedRouter) {
      fetchActiveUsers();
      fetchVpnStats();
    }
  }, [selectedRouter]);

  const fetchVpnPackages = async () => {
    try {
      const response = await fetch('/api/vpn/packages', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setVpnPackages(data);
    } catch (error) {
      console.error('Error fetching VPN packages:', error);
    }
  };

  const fetchRouters = async () => {
    try {
      const response = await fetch('/api/routers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRouters(data);
    } catch (error) {
      console.error('Error fetching routers:', error);
    }
  };

  const fetchMyVpnUsers = async () => {
    try {
      const response = await fetch('/api/vpn/my-vpn-users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setMyVpnUsers(data);
    } catch (error) {
      console.error('Error fetching VPN users:', error);
    }
  };

  const fetchActiveUsers = async () => {
    if (!selectedRouter) return;
    try {
      const response = await fetch(`/api/vpn/active/${selectedRouter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setActiveUsers(data);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const fetchVpnStats = async () => {
    if (!selectedRouter) return;
    try {
      const response = await fetch(`/api/vpn/stats/${selectedRouter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setVpnStats(data);
    } catch (error) {
      console.error('Error fetching VPN stats:', error);
    }
  };

  const createVpnUser = async () => {
    if (!selectedRouter || !selectedPackage) {
      alert('Please select router and package');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/vpn/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          packageId: selectedPackage,
          routerId: selectedRouter,
          vpnType
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`VPN User Created!\nUsername: ${data.credentials.username}\nPassword: ${data.credentials.password}`);
        fetchMyVpnUsers();
        fetchActiveUsers();
        fetchVpnStats();
      } else {
        alert('Error creating VPN user: ' + data.error);
      }
    } catch (error) {
      alert('Error creating VPN user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadOpenVpnConfig = async (routerId, username) => {
    try {
      const response = await fetch(`/api/vpn/openvpn-config/${routerId}/${username}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${username}.ovpn`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Error downloading config: ' + error.message);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">VPN Management</h1>
      </div>

      {/* VPN Stats */}
      {vpnStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Active</p>
                <p className="text-2xl font-bold text-gray-900">{vpnStats.active.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">PPTP</p>
                <p className="text-2xl font-bold text-gray-900">{vpnStats.active.pptp}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">L2TP</p>
                <p className="text-2xl font-bold text-gray-900">{vpnStats.active.l2tp}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">OpenVPN</p>
                <p className="text-2xl font-bold text-gray-900">{vpnStats.active.openvpn}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create VPN User */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Create VPN User</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedRouter}
            onChange={(e) => setSelectedRouter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="">Select Router</option>
            {routers.map(router => (
              <option key={router.id} value={router.id}>{router.name}</option>
            ))}
          </select>

          <select
            value={vpnType}
            onChange={(e) => setVpnType(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="pptp">PPTP</option>
            <option value="l2tp">L2TP</option>
            <option value="openvpn">OpenVPN</option>
          </select>

          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="">Select Package</option>
            {vpnPackages.filter(pkg => pkg.vpn_type === vpnType).map(pkg => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} - ${pkg.price}
              </option>
            ))}
          </select>

          <button
            onClick={createVpnUser}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create VPN User'}
          </button>
        </div>
      </div>

      {/* My VPN Users */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">My VPN Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Router</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myVpnUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.password}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.vpn_type.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.package_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.router_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.vpn_type === 'openvpn' && (
                      <button
                        onClick={() => downloadOpenVpnConfig(user.router_id, user.username)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Config
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active VPN Sessions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Active VPN Sessions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uptime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Out</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeUsers.map((user, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.service?.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.uptime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBytes(user.bytesIn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBytes(user.bytesOut)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VPNManager;