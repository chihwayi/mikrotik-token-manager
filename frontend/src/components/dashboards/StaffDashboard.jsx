import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { tokenAPI, packageAPI, authAPI, pdfAPI } from '../../services/api';
import { Copy, CheckCircle, XCircle, Clock, DollarSign, Sparkles, TrendingUp, User, LogOut, Router, Package, FileText, Plus, Minus, Download, Shield, Wifi } from 'lucide-react';
import VPNManager from '../VPNManager';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [packages, setPackages] = useState([]);
  const [myTokens, setMyTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelections, setBulkSelections] = useState({}); // {packageId: quantity}
  const [bulkLoading, setBulkLoading] = useState(false);
  const [lastBulkTokens, setLastBulkTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('tokens'); // 'tokens' or 'vpn'

  useEffect(() => {
    console.log('StaffDashboard: useEffect triggered');
    console.log('Current user:', user);
    loadPackages();
    loadMyTokens();
    // Refresh user data to get latest assigned router (non-blocking)
    refreshUserData().catch(err => console.error('Failed to refresh user data:', err));
  }, []);

  const refreshUserData = async () => {
    try {
      // Fetch fresh user data from backend to get latest assigned router
      const response = await authAPI.getMe();
      const freshUserData = response.data;
      
      // Update localStorage and context
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const userObj = JSON.parse(currentUser);
        userObj.assignedRouterId = freshUserData.assignedRouterId;
        localStorage.setItem('user', JSON.stringify(userObj));
        // Note: This doesn't update the context directly, but the check will work
        // For a complete fix, we'd need to add a refreshUser method to AuthContext
        console.log('User data refreshed:', freshUserData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Silent fail - user can still use the app
    }
  };

  useEffect(() => {
    calculateTodayRevenue();
  }, [myTokens]);

  const loadPackages = async () => {
    try {
      console.log('Loading packages...');
      const response = await packageAPI.getAll();
      console.log('Packages response:', response);
      // API returns packages directly, not wrapped in data
      const packagesList = response.data || [];
      console.log('Packages loaded:', packagesList);
      setPackages(packagesList);
    } catch (error) {
      console.error('Failed to load packages:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to load packages');
      setPackages([]);
    }
  };

  const loadMyTokens = async () => {
    try {
      const response = await tokenAPI.getMyTokens();
      setMyTokens(response.data);
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  };

  const calculateTodayRevenue = () => {
    // Only count revenue from tokens that have been USED (confirmed payment)
    // Not just generated tokens - those are expected revenue, not actual
    const usedTokens = myTokens.filter(
      token => token.status === 'used' && token.used_at
    );
    const today = new Date().toISOString().split('T')[0];
    const todayUsedTokens = usedTokens.filter(
      token => token.used_at?.split('T')[0] === today
    );
    const revenue = todayUsedTokens.reduce((sum, token) => sum + parseFloat(token.price || 0), 0);
    setTodayRevenue(revenue);
  };

  const generateToken = async () => {
    if (!selectedPackage) {
      return;
    }

    setLoading(true);
    try {
      const response = await tokenAPI.generate(selectedPackage.id);
      setGeneratedCode(response.data.voucher.voucher_code);
      setShowSuccess(true);
      await loadMyTokens();
      setSelectedPackage(null);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkQuantityChange = (packageId, quantity) => {
    const qty = Math.max(0, parseInt(quantity) || 0);
    setBulkSelections(prev => {
      if (qty === 0) {
        const { [packageId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [packageId]: qty };
    });
  };

  const generateBulkTokens = async () => {
    const tokenRequests = Object.entries(bulkSelections).map(([packageId, quantity]) => ({
      packageId,
      quantity: parseInt(quantity)
    }));

    if (tokenRequests.length === 0) {
      toast.error('Please select at least one package with quantity > 0');
      return;
    }

    const totalTokens = tokenRequests.reduce((sum, req) => sum + req.quantity, 0);
    if (totalTokens === 0) {
      toast.error('Total quantity must be greater than 0');
      return;
    }

    console.log('🔧 Generating bulk tokens:', tokenRequests);
    setBulkLoading(true);
    try {
      const response = await tokenAPI.generateBulk(tokenRequests);
      console.log('✅ Bulk tokens response:', response.data);
      const tokens = response.data.tokens;
      setLastBulkTokens(tokens);
      toast.success(`Successfully generated ${tokens.length} tokens!`);
      await loadMyTokens();
      // Clear selections
      setBulkSelections({});
    } catch (error) {
      console.error('❌ Bulk token generation error:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error message:', error.message);
      toast.error(error.response?.data?.error || error.message || 'Failed to generate bulk tokens');
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTokenPDF = async () => {
    if (lastBulkTokens.length === 0) {
      toast.error('No tokens available to print. Please generate tokens first.');
      return;
    }

    // Filter to only unused tokens (active or pending, but not used or expired)
    const unusedTokens = lastBulkTokens.filter(t => 
      t.status === 'active' || t.status === 'pending'
    );

    if (unusedTokens.length === 0) {
      toast.error('No unused tokens available to print. All tokens have been used or expired.');
      return;
    }

    const usedCount = lastBulkTokens.length - unusedTokens.length;
    const message = usedCount > 0 
      ? `Printing ${unusedTokens.length} unused tokens (${usedCount} already used excluded)`
      : `Printing ${unusedTokens.length} tokens`;

    try {
      const tokenIds = unusedTokens.map(t => t.id);
      const response = await pdfAPI.generateTokenPDF(tokenIds);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tokens-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`PDF downloaded successfully! ${message}`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate PDF');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-gradient-to-r from-green-400 to-green-600', text: 'text-white', icon: CheckCircle },
      pending: { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600', text: 'text-white', icon: Clock },
      used: { bg: 'bg-gradient-to-r from-blue-400 to-blue-600', text: 'text-white', icon: CheckCircle },
      expired: { bg: 'bg-gradient-to-r from-red-400 to-red-600', text: 'text-white', icon: XCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  const activeTokens = myTokens.filter(t => t.status === 'active').length;
  const todayTokens = myTokens.filter(
    token => token.generated_at?.split('T')[0] === new Date().toISOString().split('T')[0]
  ).length;

  // Only log on mount or when key values change (to avoid infinite loop)
  useEffect(() => {
    console.log('StaffDashboard: Component mounted or key values changed');
    console.log('  User:', user?.email);
    console.log('  Packages:', packages.length);
    console.log('  Tokens:', myTokens.length);
    console.log('  Router assigned:', !!(user?.assignedRouterId || user?.assigned_router_id));
  }, [user?.id, packages.length, myTokens.length]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header - Mobile Responsive */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 py-3 sm:py-0 sm:h-16 sm:items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Router className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Token Generation Portal</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="text-left sm:text-right px-2 sm:px-0">
                <p className="text-xs text-gray-500">Today's Revenue</p>
                <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ${todayRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">(Used tokens only)</p>
              </div>
              <div className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-lg">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
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

      {/* Success Modal - Mobile Responsive */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto transform animate-slide-up">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Token Generated!</h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 mb-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Voucher Code:</p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="text-lg sm:text-2xl font-mono font-bold text-gray-900 break-all">{generatedCode}</code>
                  <button
                    onClick={() => copyToClipboard(generatedCode)}
                    className="p-1.5 sm:p-2 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedCode === generatedCode ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="btn-primary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-4 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tokens')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tokens'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4" />
                  <span>Hotspot Tokens</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('vpn')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vpn'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>VPN Access</span>
                </div>
              </button>
            </nav>
          </div>
        </div>
        {activeTab === 'tokens' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="stat-card card-hover">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 shadow-lg">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="ml-4 sm:ml-5">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Tokens</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{myTokens.length}</p>
                <p className="text-xs text-gray-400 mt-1">{todayTokens} today</p>
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
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{activeTokens}</p>
                <p className="text-xs text-gray-400 mt-1">Currently in use</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card card-hover">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-3 sm:p-4 shadow-lg">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="ml-4 sm:ml-5">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Today's Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ${todayRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {(() => {
                    const todayUsed = myTokens.filter(t => 
                      t.status === 'used' && t.used_at?.split('T')[0] === new Date().toISOString().split('T')[0]
                    ).length;
                    return `${todayUsed} tokens used today`;
                  })()}
                </p>
              </div>
            </div>
          </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Token Generator */}
          <div className="card animate-slide-up">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {bulkMode ? 'Bulk Token Generation' : 'Generate Token'}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  {lastBulkTokens.length > 0 && (() => {
                    const unusedCount = lastBulkTokens.filter(t => 
                      t.status === 'active' || t.status === 'pending'
                    ).length;
                    const usedCount = lastBulkTokens.length - unusedCount;
                    return (
                      <button
                        onClick={downloadTokenPDF}
                        className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                        title={usedCount > 0 ? `${unusedCount} unused tokens will be printed (${usedCount} used tokens excluded)` : 'Print all unused tokens'}
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Print PDF ({unusedCount}{usedCount > 0 ? `/${lastBulkTokens.length}` : ''})</span>
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {bulkMode ? 'Single Mode' : 'Bulk Mode'}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {(() => {
                console.log('StaffDashboard: Rendering token generator');
                console.log('User:', user);
                console.log('Packages:', packages);
                
                // Check both context user and localStorage for assigned router
                // This handles cases where router was assigned after login
                let assignedRouterId = user?.assignedRouterId || user?.assigned_router_id;
                console.log('Assigned router ID from context:', assignedRouterId);
                
                if (!assignedRouterId) {
                  try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                      const parsedUser = JSON.parse(storedUser);
                      assignedRouterId = parsedUser.assignedRouterId || parsedUser.assigned_router_id;
                      console.log('Assigned router ID from localStorage:', assignedRouterId);
                    }
                  } catch (e) {
                    console.error('Error parsing stored user:', e);
                  }
                }
                
                console.log('Final assigned router ID:', assignedRouterId);
                
                if (!assignedRouterId) {
                  console.log('No router assigned - showing error message');
                  return (
                    <div className="text-center py-8 sm:py-12">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-4">
                        <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                      </div>
                      <p className="text-red-600 font-semibold text-base sm:text-lg mb-2">No Router Assigned</p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-4">Please contact your administrator</p>
                      <p className="text-xs text-gray-400 italic">Note: If a router was just assigned, please refresh the page or log out and back in.</p>
                      <button 
                        onClick={refreshUserData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Refresh User Data
                      </button>
                    </div>
                  );
                }
                
                console.log('Router assigned, showing packages:', packages.length);
                
                return (
                  <>
                    {packages.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium text-sm sm:text-base">No packages available</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-2">Please contact your administrator to create packages</p>
                        <button 
                          onClick={loadPackages}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Reload Packages
                        </button>
                      </div>
                    ) : bulkMode ? (
                      // Bulk Token Generation Mode
                      <>
                        <div className="mb-4 sm:mb-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                            Select Packages and Quantities
                          </label>
                          <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {packages.map((pkg) => {
                              const quantity = bulkSelections[pkg.id] || 0;
                              return (
                                <div
                                  key={pkg.id}
                                  className="p-3 sm:p-4 border-2 rounded-xl border-gray-200 bg-white"
                                >
                                  <div className="flex justify-between items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-gray-900 text-base sm:text-lg">{pkg.name}</p>
                                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{pkg.description}</p>
                                      <div className="flex items-center space-x-3 sm:space-x-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {pkg.duration_hours}h
                                        </span>
                                        <span className="flex items-center">
                                          <Router className="w-3 h-3 mr-1" />
                                          {pkg.data_limit_mb}MB
                                        </span>
                                        <span className="font-semibold text-blue-600">${pkg.price}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleBulkQuantityChange(pkg.id, quantity - 1)}
                                        className="p-1.5 sm:p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        disabled={quantity === 0}
                                      >
                                        <Minus className="w-4 h-4 text-gray-600" />
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={quantity}
                                        onChange={(e) => handleBulkQuantityChange(pkg.id, e.target.value)}
                                        className="w-16 sm:w-20 px-2 py-1.5 text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold"
                                        placeholder="0"
                                      />
                                      <button
                                        onClick={() => handleBulkQuantityChange(pkg.id, quantity + 1)}
                                        className="p-1.5 sm:p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                      >
                                        <Plus className="w-4 h-4 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-700">
                            Total Tokens: {Object.values(bulkSelections).reduce((sum, qty) => sum + qty, 0)}
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            Total Revenue: ${Object.entries(bulkSelections).reduce((sum, [pkgId, qty]) => {
                              const pkg = packages.find(p => p.id === pkgId);
                              return sum + (pkg ? pkg.price * qty : 0);
                            }, 0).toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={generateBulkTokens}
                          disabled={Object.keys(bulkSelections).length === 0 || bulkLoading}
                          className="btn-primary w-full flex items-center justify-center space-x-2 py-4 text-lg"
                        >
                          {bulkLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Generating Tokens...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              <span>Generate All Tokens</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      // Single Token Generation Mode
                      <>
                        <div className="mb-4 sm:mb-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                            Select Package
                          </label>
                          <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            {packages.map((pkg) => (
                              <button
                                key={pkg.id}
                                onClick={() => setSelectedPackage(pkg)}
                                className={`p-3 sm:p-4 border-2 rounded-xl text-left transition-all duration-200 transform hover:scale-105 ${
                                  selectedPackage?.id === pkg.id
                                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-500'
                                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-base sm:text-lg">{pkg.name}</p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{pkg.description}</p>
                                    <div className="flex items-center space-x-3 sm:space-x-4 mt-2 sm:mt-3 text-xs text-gray-500">
                                      <span className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {pkg.duration_hours}h
                                      </span>
                                      <span className="flex items-center">
                                        <Router className="w-3 h-3 mr-1" />
                                        {pkg.data_limit_mb}MB
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-2 sm:ml-4 flex-shrink-0">
                                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                      ${pkg.price}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={generateToken}
                          disabled={!selectedPackage || loading}
                          className="btn-primary w-full flex items-center justify-center space-x-2 py-4 text-lg"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              <span>Generate Token</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Recent Tokens */}
          <div className="card animate-slide-up">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Tokens</h2>
                </div>
                <div className="flex items-center space-x-2">
                  {myTokens.length > 0 && (() => {
                    const unusedTokens = myTokens.filter(t => {
                      const status = (t.status || '').toLowerCase();
                      return status === 'active' || status === 'pending';
                    });
                    
                    console.log('Print button check - myTokens:', myTokens.length, 'unusedTokens:', unusedTokens.length, 'tokens:', myTokens.map(t => ({ id: t.id, status: t.status })));
                    
                    // Always show print button if there are tokens, even if all are used (user might want to print anyway)
                    const tokensToPrint = unusedTokens.length > 0 ? unusedTokens : myTokens;
                    const label = unusedTokens.length > 0 ? `${unusedTokens.length} unused` : `${myTokens.length} all`;
                    
                    return (
                      <button
                        onClick={async () => {
                          try {
                            const tokenIds = tokensToPrint.map(t => t.id);
                            console.log('Generating PDF for tokens:', tokenIds.length);
                            const response = await pdfAPI.generateTokenPDF(tokenIds);
                            const blob = new Blob([response.data], { type: 'application/pdf' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `tokens-${new Date().toISOString().split('T')[0]}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            toast.success(`PDF downloaded! ${tokensToPrint.length} token${tokensToPrint.length !== 1 ? 's' : ''} printed.`);
                          } catch (error) {
                            console.error('PDF generation error:', error);
                            toast.error(error.response?.data?.error || 'Failed to generate PDF');
                          }
                        }}
                        className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 shadow-md"
                        title={`Print ${label} tokens`}
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Print PDF</span>
                        <span className="sm:hidden">Print</span>
                        <span className="ml-1">({tokensToPrint.length})</span>
                      </button>
                    );
                  })()}
                  <span className="badge-info text-xs sm:text-sm">{myTokens.length}</span>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {myTokens.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-sm sm:text-base">No tokens generated yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">Generate your first token to get started</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-3">Showing most recent 20 tokens (Total: {myTokens.length})</p>
                  <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto custom-scrollbar">
                    {myTokens.slice(0, 20).map((token) => (
                    <div
                      key={token.id}
                      className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-2 sm:mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <code className="text-xs sm:text-base font-mono font-bold text-gray-900 bg-gray-100 px-2 sm:px-3 py-1 rounded-lg break-all">
                              {token.voucher_code}
                            </code>
                            <button
                              onClick={() => copyToClipboard(token.voucher_code)}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                              title="Copy code"
                            >
                              {copiedCode === token.voucher_code ? (
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700">{token.package_name}</p>
                        </div>
                        <div className="flex-shrink-0">{getStatusBadge(token.status)}</div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span className="flex items-center">
                          <Router className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{token.router_name}</span>
                        </span>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                          <span className="font-semibold text-blue-600">${token.price}</span>
                          <span className="text-gray-400">{formatDate(token.generated_at)}</span>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
            </div>
          </>
        )}

        {activeTab === 'vpn' && <VPNManager />}
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

export default StaffDashboard;
