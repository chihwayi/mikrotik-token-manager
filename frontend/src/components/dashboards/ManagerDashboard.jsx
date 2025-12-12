import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { analyticsAPI, routerAPI, tokenAPI, adminAPI, packageAPI } from '../../services/api';
import { TrendingUp, Users, DollarSign, Activity, AlertCircle, CheckCircle, Router, LogOut, BarChart3, Calendar, Plus, X, UserPlus, Edit, Trash2, TestTube, Package } from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import ConfirmDialog from '../common/ConfirmDialog';
import { getAllProvinces, getDistrictsForProvince } from '../../data/zimbabweGeography';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [routers, setRouters] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [recentTokens, setRecentTokens] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouter, setSelectedRouter] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [assigningRouter, setAssigningRouter] = useState(null);
  const [showRouterForm, setShowRouterForm] = useState(false);
  const [editingRouter, setEditingRouter] = useState(null);
  const [deletingRouter, setDeletingRouter] = useState(null);
  const [testingRouter, setTestingRouter] = useState(null);
  const [dateRange, setDateRange] = useState({ 
    start: getDateDaysAgo(30), 
    end: new Date().toISOString().split('T')[0] 
  });
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
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    durationHours: '',
    dataLimitMb: '',
    price: '',
    description: '',
    active: true
  });

  function getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    loadData();
  }, [dateRange, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [
        analyticsAPI.getOverview(dateRange.start, dateRange.end),
        routerAPI.getAll(),
        tokenAPI.getAllTokens({ limit: 20 })
      ];
      
      let usersPromise = null;
      let packagesPromise = null;
      
      if (activeTab === 'users') {
        usersPromise = adminAPI.getUsers();
        promises.push(usersPromise);
      }
      if (activeTab === 'packages') {
        packagesPromise = packageAPI.getAll(false);
        promises.push(packagesPromise);
      }
      
      const results = await Promise.all(promises);
      setOverview(results[0].data);
      setRouters(results[1].data);
      setRecentTokens(results[2].data);
      
      if (usersPromise) {
        const usersIndex = promises.indexOf(usersPromise);
        if (results[usersIndex]) {
          // Filter out super_admin users for managers
          const filteredUsers = results[usersIndex].data.filter(u => u.role !== 'super_admin');
          setAllUsers(filteredUsers);
        }
      }
      
      if (packagesPromise) {
        const packagesIndex = promises.indexOf(packagesPromise);
        if (results[packagesIndex]) {
          setPackages(results[packagesIndex].data);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error(error.response?.data?.error || 'Failed to load data');
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
    if (!routerForm.apiPassword || !routerForm.apiPassword.trim()) {
      toast.error('Please enter an API password');
      return;
    }
    try {
      await routerAPI.create(routerForm);
      toast.success('Router created successfully!');
      setShowRouterForm(false);
      setRouterForm({ name: '', location: '', ip_address: '', api_port: 8728, api_username: '', apiPassword: '', router_model: '', province: '', district: '', town: '' });
      setAvailableDistricts([]);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create router');
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
      toast.success(result.message || 'Connection test successful!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Connection test failed');
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
      apiPassword: '',
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
      district: '',
      town: ''
    });
    setAvailableDistricts(province ? getDistrictsForProvince(province) : []);
  };

  const handleDistrictChange = (district) => {
    setRouterForm({ 
      ...routerForm, 
      district: district,
      town: ''
    });
  };

  const getRouterHealthColor = (health) => {
    if (!health || !health.is_online) return 'bg-red-500';
    return 'bg-green-500';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'routers', label: 'Routers', icon: Router },
    { id: 'packages', label: 'Packages', icon: Package }
  ];

  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
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
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Analytics & Monitoring</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              {activeTab === 'overview' && (
                <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-lg text-xs sm:text-sm">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="border-0 bg-transparent text-xs sm:text-sm font-medium text-gray-700 focus:outline-none w-24 sm:w-auto"
                  />
                  <span className="text-gray-400 text-xs">to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="border-0 bg-transparent text-xs sm:text-sm font-medium text-gray-700 focus:outline-none w-24 sm:w-auto"
                  />
                </div>
              )}
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center sm:text-left">{user?.email}</span>
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
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
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
        {activeTab === 'overview' && overview && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="stat-card card-hover">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 shadow-lg">
                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Tokens</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {overview.tokens?.total_tokens || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card card-hover">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 sm:p-4 shadow-lg">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Active Tokens</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {overview.tokens?.active_tokens || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card card-hover">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-3 sm:p-4 shadow-lg">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ${parseFloat(overview.revenue?.total_revenue || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card card-hover">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-3 sm:p-4 shadow-lg">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Confirmed</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      ${parseFloat(overview.revenue?.confirmed_revenue || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Routers Status */}
              <div className="lg:col-span-2 card animate-slide-up">
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex items-center space-x-2">
                    <Router className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Router Status</h2>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {routers.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <Router className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No routers configured</p>
                      </div>
                    ) : (
                      routers.map((router) => (
                        <div
                          key={router.id}
                          className="border-2 border-gray-200 rounded-xl p-4 sm:p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white"
                          onClick={() => setSelectedRouter(router)}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getRouterHealthColor(router.health)} shadow-lg animate-pulse flex-shrink-0`}></div>
                                <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">{router.name}</h3>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center">
                                <Router className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{router.location}</span>
                              </p>
                              <p className="text-xs text-gray-500 font-mono truncate">{router.ip_address}</p>
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                              {router.health && (
                                <>
                                  <p className="text-base sm:text-lg font-bold text-gray-900">
                                    {router.health.active_users || 0}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {router.health.is_online ? (
                                      <span className="text-green-600 font-semibold">Online</span>
                                    ) : (
                                      <span className="text-red-600 font-semibold">Offline</span>
                                    )}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card animate-slide-up">
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Tokens</h2>
                    </div>
                    <span className="badge-info text-xs sm:text-sm">{recentTokens.length}</span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto custom-scrollbar">
                    {recentTokens.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No tokens yet</p>
                      </div>
                    ) : (
                      recentTokens.map((token) => (
                        <div key={token.id} className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-transparent rounded-r-lg hover:shadow-md transition-all">
                          <p className="text-xs sm:text-sm font-mono font-bold text-gray-900 break-all">{token.voucher_code}</p>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {token.staff_email} • {token.router_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(token.generated_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Enter password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Router (Optional)</label>
                        <select
                          value={userForm.assignedRouterId}
                          onChange={(e) => setUserForm({ ...userForm, assignedRouterId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
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
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Router</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                          <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No users found</p>
                        </td>
                      </tr>
                    ) : (
                      allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-purple-50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            <div className="max-w-[150px] sm:max-w-none truncate">{u.email}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className="px-2 sm:px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600">
                            {u.assigned_router_id ? (
                              <span className="truncate max-w-[120px] sm:max-w-none inline-block">
                                {routers.find(r => r.id === u.assigned_router_id)?.name || 'Unknown'}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {u.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {u.role === 'staff' && (
                              <button
                                onClick={() => setAssigningRouter(u.id)}
                                className="text-xs sm:text-sm px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-semibold transition-colors"
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
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
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

        {/* Router Form Modal */}
        {(showRouterForm || editingRouter) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Main Router"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                    <input
                      type="text"
                      value={routerForm.location}
                      onChange={(e) => setRouterForm({ ...routerForm, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="8728"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Username *</label>
                    <input
                      type="text"
                      value={routerForm.api_username}
                      onChange={(e) => setRouterForm({ ...routerForm, api_username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Router Model (Optional)</label>
                    <input
                      type="text"
                      value={routerForm.router_model}
                      onChange={(e) => setRouterForm({ ...routerForm, router_model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
                  >
                    {editingRouter ? 'Update Router' : 'Create Router'}
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

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="animate-slide-up">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Token Packages</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Create and manage your service packages</p>
              </div>
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setPackageForm({ name: '', durationHours: '', dataLimitMb: '', price: '', description: '', active: true });
                  setShowPackageForm(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Package</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {packages.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No packages found</p>
                  <p className="text-xs text-gray-400 mt-2">Create your first package to get started</p>
                </div>
              ) : (
                packages.map((pkg) => (
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
                ))
              )}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="5.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
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
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors"
                  >
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default ManagerDashboard;
