import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminAPI, routerAPI, packageAPI } from '../../services/api';
import { Settings, Users, Router, Package, BarChart3, AlertTriangle, Plus, LogOut, Shield, TrendingUp, Activity, UserPlus, X, Edit, Trash2, TestTube } from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import ConfirmDialog from '../common/ConfirmDialog';
import { getAllProvinces, getDistrictsForProvince } from '../../data/zimbabweGeography';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [routers, setRouters] = useState([]);
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [assigningRouter, setAssigningRouter] = useState(null);
  const [showRouterForm, setShowRouterForm] = useState(false);
  const [editingRouter, setEditingRouter] = useState(null);
  const [deletingRouter, setDeletingRouter] = useState(null);
  const [testingRouter, setTestingRouter] = useState(null);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'staff',
    assignedRouterId: ''
  });
  const [routerForm, setRouterForm] = useState({
    name: '',
    location: '',
    ip_address: '',
    api_port: 8728,
    api_username: '',
    apiPassword: '',
    router_model: '',
    province: '',
    district: '',
    town: ''
  });
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    durationHours: '',
    dataLimitMb: '',
    price: '',
    description: '',
    active: true
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, routersRes, usersRes, packagesRes, alertsRes] = await Promise.all([
        adminAPI.getStats(),
        routerAPI.getAll(),
        adminAPI.getUsers(),
        packageAPI.getAll(false),
        adminAPI.getAlerts({ resolved: false, limit: 10 })
      ]);
      setStats(statsRes.data);
      setRouters(routersRes.data);
      setUsers(usersRes.data);
      setPackages(packagesRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    // Custom validation
    if (!userForm.email || !userForm.email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (!userForm.password || userForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (!userForm.role) {
      toast.error('Please select a role');
      return;
    }
    try {
      await adminAPI.createUser(userForm);
      toast.success('User created successfully!');
      setShowUserForm(false);
      setUserForm({ email: '', password: '', role: 'staff', assignedRouterId: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleAssignRouter = async (userId, routerId) => {
    try {
      await adminAPI.assignRouter(userId, routerId);
      toast.success('Router assigned successfully!');
      setAssigningRouter(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign router');
    }
  };

  const handleCreateRouter = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('handleCreateRouter called', routerForm);
    
    // Custom validation
    if (!routerForm.name || !routerForm.name.trim()) {
      toast.error('Please enter a router name');
      return;
    }
    if (!routerForm.location || !routerForm.location.trim()) {
      toast.error('Please enter a location');
      return;
    }
    if (!routerForm.ip_address || !routerForm.ip_address.trim()) {
      toast.error('Please enter an IP address');
      return;
    }
    if (!routerForm.api_username || !routerForm.api_username.trim()) {
      toast.error('Please enter an API username');
      return;
    }
    if (!routerForm.apiPassword || !routerForm.apiPassword.trim()) {
      toast.error('Please enter an API password');
      return;
    }
    try {
      console.log('Creating router with data:', routerForm);
      const response = await routerAPI.create(routerForm);
      console.log('Router creation response:', response);
      toast.success('Router created successfully!');
      setShowRouterForm(false);
      setRouterForm({ name: '', location: '', ip_address: '', api_port: 8728, api_username: '', apiPassword: '', router_model: '', province: '', district: '', town: '' });
      setAvailableDistricts([]);
      loadData();
    } catch (error) {
      console.error('Error creating router:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create router';
      toast.error(errorMessage);
    }
  };

  const handleUpdateRouter = async (e) => {
    e.preventDefault();
    // Custom validation
    if (!routerForm.name || !routerForm.name.trim()) {
      toast.error('Please enter a router name');
      return;
    }
    if (!routerForm.location || !routerForm.location.trim()) {
      toast.error('Please enter a location');
      return;
    }
    if (!routerForm.ip_address || !routerForm.ip_address.trim()) {
      toast.error('Please enter an IP address');
      return;
    }
    if (!routerForm.api_username || !routerForm.api_username.trim()) {
      toast.error('Please enter an API username');
      return;
    }
    try {
      await routerAPI.update(editingRouter.id, routerForm);
      toast.success('Router updated successfully!');
      setEditingRouter(null);
      setRouterForm({ name: '', location: '', ip_address: '', api_port: 8728, api_username: '', apiPassword: '', router_model: '', province: '', district: '', town: '' });
      setAvailableDistricts([]);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update router');
    }
  };

  const handleDeleteRouter = async () => {
    try {
      await routerAPI.delete(deletingRouter.id);
      toast.success('Router deleted successfully!');
      setDeletingRouter(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete router');
    }
  };

  const handleTestConnection = async (routerId) => {
    setTestingRouter(routerId);
    try {
      const result = await routerAPI.testConnection(routerId);
      if (result.success) {
        toast.success(result.message || 'Connection test successful!');
      } else {
        toast.error(result.message || 'Connection test failed');
      }
      // Refresh router list to get updated health status
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Connection test failed');
      // Refresh router list even on error to get latest status
      await loadData();
    } finally {
      setTimeout(() => setTestingRouter(null), 1000);
    }
  };

  const openEditRouter = (router) => {
    setEditingRouter(router);
    const province = router.province || '';
    const districts = province ? getDistrictsForProvince(province) : [];
    setRouterForm({
      name: router.name || '',
      location: router.location || '',
      ip_address: router.ip_address || '',
      api_port: router.api_port || 8728,
      api_username: router.api_username || '',
      apiPassword: '', // Don't populate password for security
      router_model: router.router_model || '',
      province: province,
      district: router.district || '',
      town: router.town || ''
    });
    setAvailableDistricts(districts);
  };

  const handleProvinceChange = (province) => {
    setRouterForm({ 
      ...routerForm, 
      province: province,
      district: '', // Reset district when province changes
      town: '' // Reset town when province changes
    });
    setAvailableDistricts(province ? getDistrictsForProvince(province) : []);
  };

  const handleDistrictChange = (district) => {
    setRouterForm({ 
      ...routerForm, 
      district: district,
      town: '' // Reset town when district changes
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'routers', label: 'Routers', icon: Router },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header - Mobile Responsive */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 py-3 sm:py-0 sm:h-16 sm:items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-xs text-gray-500 hidden sm:block">System Management</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-lg">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs - Mobile Responsive */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 sm:py-4 px-3 sm:px-6 border-b-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-4 lg:px-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="stat-card card-hover">
                  <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 shadow-lg">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.users}</p>
                  </div>
                </div>
              </div>
              <div className="stat-card card-hover">
                  <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 sm:p-4 shadow-lg">
                    <Router className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Active Routers</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.routers}</p>
                  </div>
                </div>
              </div>
              <div className="stat-card card-hover">
                  <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-3 sm:p-4 shadow-lg">
                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Tokens</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.tokens}</p>
                  </div>
                </div>
              </div>
              <div className="stat-card card-hover">
                  <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-3 sm:p-4 shadow-lg">
                    <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Unread Alerts</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.unreadAlerts}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Routers Tab */}
        {activeTab === 'routers' && (
          <div className="animate-slide-up">
            <div className="card">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Router Management</h2>
                  <button
                    onClick={() => {
                    setShowRouterForm(true);
                    setEditingRouter(null);
                    setRouterForm({ name: '', location: '', ip_address: '', api_port: 8728, api_username: '', apiPassword: '', router_model: '', province: '', district: '', town: '' });
                    setAvailableDistricts([]);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Router</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Location</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">IP Address</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Last Sync</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {routers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                          <Router className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No routers configured</p>
                        </td>
                      </tr>
                    ) : (
                      routers.map((router) => (
                        <tr key={router.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-900">
                            <div className="max-w-[120px] sm:max-w-none truncate">{router.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">{router.location}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 hidden sm:table-cell">
                            {router.location}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-mono text-gray-500">
                            <div className="max-w-[100px] sm:max-w-none truncate">{router.ip_address}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              router.health?.is_online
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {router.health?.is_online ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                            {router.last_sync ? new Date(router.last_sync).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleTestConnection(router.id)}
                                disabled={testingRouter === router.id}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Test Connection"
                              >
                                <TestTube className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditRouter(router)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                title="Edit Router"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingRouter(router)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Router"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="animate-slide-up">
            <div className="card">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
                  <button
                    onClick={() => setShowUserForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create User</span>
                  </button>
                </div>
              </div>

              {/* User Creation Form Modal */}
              {showUserForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Create New User</h3>
                      <button
                        onClick={() => setShowUserForm(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <form onSubmit={handleCreateUser} className="space-y-4" noValidate>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Router (Optional)</label>
                        <select
                          value={userForm.assignedRouterId}
                          onChange={(e) => setUserForm({ ...userForm, assignedRouterId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">None</option>
                          {routers.map((router) => (
                            <option key={router.id} value={router.id}>{router.name} - {router.location}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowUserForm(false)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Users Table - Mobile Responsive */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-purple-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Router</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                          <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No users found</p>
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-purple-50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-900">
                            <div className="max-w-[150px] sm:max-w-none truncate">{u.email}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className="px-2 sm:px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 hidden sm:table-cell">
                            {u.assigned_router_id ? (
                              <span className="truncate max-w-[120px] sm:max-w-none inline-block">
                                {routers.find(r => r.id === u.assigned_router_id)?.name || 'Unknown'}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {u.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                            {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            {u.role === 'staff' && (
                              <button
                                onClick={() => setAssigningRouter(u.id)}
                                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-semibold transition-colors whitespace-nowrap"
                              >
                                {u.assigned_router_id ? 'Reassign' : 'Assign'} Router
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="animate-slide-up">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Token Packages</h2>
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setPackageForm({ name: '', durationHours: '', dataLimitMb: '', price: '', description: '', active: true });
                  setShowPackageForm(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Package</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {packages.map((pkg) => (
                <div key={pkg.id} className="card card-hover bg-gradient-to-br from-white to-gray-50">
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{pkg.name}</h3>
                      <span className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-full ${
                        pkg.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">{pkg.description}</p>
                    <div className="space-y-2 sm:space-y-3 bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-bold text-gray-900">{pkg.duration_hours}h</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Data Limit:</span>
                        <span className="font-bold text-gray-900">{pkg.data_limit_mb}MB</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Price:</span>
                        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          ${pkg.price}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingPackage(pkg);
                          setPackageForm({
                            name: pkg.name,
                            durationHours: pkg.duration_hours,
                            dataLimitMb: pkg.data_limit_mb,
                            price: pkg.price,
                            description: pkg.description || '',
                            active: pkg.active
                          });
                          setShowPackageForm(true);
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmDialog({
                              isOpen: true,
                              title: pkg.active ? 'Deactivate Package?' : 'Activate Package?',
                              message: `Are you sure you want to ${pkg.active ? 'deactivate' : 'activate'} "${pkg.name}"? ${pkg.active ? 'This will make it unavailable for new tokens.' : 'This will make it available for token generation.'}`,
                              type: pkg.active ? 'warning' : 'info',
                              confirmText: pkg.active ? 'Deactivate' : 'Activate',
                              onConfirm: async () => {
                                try {
                                  await packageAPI.update(pkg.id, { active: !pkg.active });
                                  toast.success(`Package ${pkg.active ? 'deactivated' : 'activated'} successfully!`);
                                  loadData();
                                } catch (error) {
                                  toast.error(error.response?.data?.error || 'Failed to update package');
                                }
                              }
                            });
                          }}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {pkg.active ? <X className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        <span>{pkg.active ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="animate-slide-up">
            <div className="card">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-red-50">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">System Alerts</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {alerts.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No active alerts</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <span className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-gray-900">{alert.type}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 mb-2">{alert.message}</p>
                          {alert.router_name && (
                            <p className="text-xs text-gray-500 flex items-center">
                              <Router className="w-3 h-3 mr-1 flex-shrink-0" />
                              Router: {alert.router_name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await adminAPI.resolveAlert(alert.id);
                              toast.success('Alert resolved successfully!');
                              loadData();
                            } catch (error) {
                              toast.error(error.response?.data?.error || 'Failed to resolve alert');
                            }
                          }}
                          className="ml-0 sm:ml-4 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors w-full sm:w-auto"
                        >
                          Resolve
                        </button>
                      </div>
                      <p className="mt-3 text-xs text-gray-400">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Router Form Modal */}
        {(showRouterForm || editingRouter) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowRouterForm(false);
              setEditingRouter(null);
              setRouterForm({ name: '', location: '', ip_address: '', api_port: 8728, api_username: '', apiPassword: '', router_model: '', province: '', district: '', town: '' });
              setAvailableDistricts([]);
            }}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingRouter ? 'Edit Router' : 'Add New Router'}
                </h3>
                <button
                  onClick={() => {
                    setShowRouterForm(false);
                    setEditingRouter(null);
                    setRouterForm({ name: '', location: '', ip_address: '', api_port: 8728, api_username: '', apiPassword: '', router_model: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={editingRouter ? handleUpdateRouter : handleCreateRouter} className="space-y-4" noValidate>
                {/* Row 1: Router Name and Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Router Name *</label>
                      <input
                        type="text"
                        value={routerForm.name}
                        onChange={(e) => setRouterForm({ ...routerForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Main Router"
                      />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                      <input
                        type="text"
                        value={routerForm.location}
                        onChange={(e) => setRouterForm({ ...routerForm, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Office Building A"
                      />
                  </div>
                </div>

                {/* Row 2: Province and District */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                    <SearchableSelect
                      options={getAllProvinces().map(p => ({ value: p, label: p }))}
                      value={routerForm.province}
                      onChange={handleProvinceChange}
                      placeholder="Select Province..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                    <SearchableSelect
                      options={availableDistricts.map(d => ({ value: d, label: d }))}
                      value={routerForm.district}
                      onChange={handleDistrictChange}
                      placeholder="Select District..."
                      disabled={!routerForm.province}
                    />
                  </div>
                </div>

                {/* Row 3: Town and IP Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Town</label>
                    <input
                      type="text"
                      value={routerForm.town}
                      onChange={(e) => setRouterForm({ ...routerForm, town: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter Town Name"
                      disabled={!routerForm.district}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">IP Address *</label>
                      <input
                        type="text"
                        value={routerForm.ip_address}
                        onChange={(e) => setRouterForm({ ...routerForm, ip_address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                        placeholder="192.168.1.1"
                      />
                  </div>
                </div>

                {/* Row 4: API Port and API Username */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Port</label>
                    <input
                      type="number"
                      value={routerForm.api_port}
                      onChange={(e) => setRouterForm({ ...routerForm, api_port: parseInt(e.target.value) || 8728 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="8728"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Username *</label>
                      <input
                        type="text"
                        value={routerForm.api_username}
                        onChange={(e) => setRouterForm({ ...routerForm, api_username: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="admin"
                      />
                  </div>
                </div>

                {/* Row 5: API Password and Router Model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      API Password {editingRouter ? '(leave blank to keep current)' : '*'}
                    </label>
                      <input
                        type="password"
                        value={routerForm.apiPassword}
                        onChange={(e) => setRouterForm({ ...routerForm, apiPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={editingRouter ? "Enter password (leave blank to keep current)" : "Enter password"}
                      />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Router Model (Optional)</label>
                    <input
                      type="text"
                      value={routerForm.router_model}
                      onChange={(e) => setRouterForm({ ...routerForm, router_model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="RB750Gr3"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRouterForm(false);
                      setEditingRouter(null);
                      setRouterForm({ name: '', location: '', ip_address: '', api_port: 8728, api_username: '', apiPassword: '', router_model: '', province: '', district: '', town: '' });
                      setAvailableDistricts([]);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                  >
                    {editingRouter ? 'Update Router' : 'Create Router'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Package Form Modal */}
        {(showPackageForm || editingPackage) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingPackage ? 'Edit Package' : 'Add New Package'}
                </h3>
                <button
                  onClick={() => {
                    setShowPackageForm(false);
                    setEditingPackage(null);
                    setPackageForm({ name: '', durationHours: '', dataLimitMb: '', price: '', description: '', active: true });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                // Custom validation instead of browser validation
                if (!packageForm.name || !packageForm.name.trim()) {
                  toast.error('Please enter a package name');
                  return;
                }
                if (!packageForm.durationHours || packageForm.durationHours < 1) {
                  toast.error('Please enter a valid duration (minimum 1 hour)');
                  return;
                }
                if (!packageForm.dataLimitMb || packageForm.dataLimitMb < 1) {
                  toast.error('Please enter a valid data limit (minimum 1 MB)');
                  return;
                }
                if (!packageForm.price || packageForm.price < 0) {
                  toast.error('Please enter a valid price');
                  return;
                }
                try {
                  if (editingPackage) {
                    await packageAPI.update(editingPackage.id, packageForm);
                    toast.success('Package updated successfully!');
                  } else {
                    await packageAPI.create(packageForm);
                    toast.success('Package created successfully!');
                  }
                  setShowPackageForm(false);
                  setEditingPackage(null);
                  setPackageForm({ name: '', durationHours: '', dataLimitMb: '', price: '', description: '', active: true });
                  loadData();
                } catch (error) {
                  toast.error(error.response?.data?.error || `Failed to ${editingPackage ? 'update' : 'create'} package`);
                }
              }} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Package Name *</label>
                    <input
                      type="text"
                      value={packageForm.name}
                      onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 3 Hours Package"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Hours) *</label>
                    <input
                      type="number"
                      min="1"
                      value={packageForm.durationHours}
                      onChange={(e) => setPackageForm({ ...packageForm, durationHours: parseInt(e.target.value) || '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Data Limit (MB) *</label>
                    <input
                      type="number"
                      min="1"
                      value={packageForm.dataLimitMb}
                      onChange={(e) => setPackageForm({ ...packageForm, dataLimitMb: parseInt(e.target.value) || '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="5120"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (USD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) || '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="5.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Package description..."
                    rows="3"
                  />
                </div>
                {editingPackage && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={packageForm.active}
                      onChange={(e) => setPackageForm({ ...packageForm, active: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                )}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPackageForm(false);
                      setEditingPackage(null);
                      setPackageForm({ name: '', durationHours: '', dataLimitMb: '', price: '', description: '', active: true });
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                  >
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen || deletingRouter !== null}
          onClose={() => {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            setDeletingRouter(null);
          }}
          onConfirm={() => {
            if (deletingRouter) {
              handleDeleteRouter();
            } else if (confirmDialog.onConfirm) {
              confirmDialog.onConfirm();
            }
          }}
          title={deletingRouter ? 'Delete Router' : confirmDialog.title}
          message={deletingRouter ? `Are you sure you want to delete "${deletingRouter.name}"? This action cannot be undone. The router will be permanently removed from the system.` : confirmDialog.message}
          type={deletingRouter ? 'danger' : confirmDialog.type}
          confirmText={deletingRouter ? 'Delete Router' : confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
        />

        {/* Router Assignment Modal */}
        {assigningRouter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Assign Router</h3>
                <button
                  onClick={() => setAssigningRouter(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Router</label>
                <SearchableSelect
                  options={routers.map(router => ({
                    value: router.id,
                    label: `${router.name} - ${router.location || 'No location'}`,
                    location: router.location,
                    province: router.province,
                    district: router.district,
                    town: router.town,
                    ip: router.ip_address
                  }))}
                  value={null}
                  onChange={(routerId) => {
                    if (routerId) {
                      handleAssignRouter(assigningRouter, routerId);
                    }
                  }}
                  placeholder="Search by name, location, province, district, or IP..."
                  searchKeys={['location', 'province', 'district', 'town', 'ip']}
                />
                <button
                  onClick={() => setAssigningRouter(null)}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
