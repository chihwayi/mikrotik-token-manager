import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { tokenAPI, packageAPI } from '../../services/api';
import { Copy, CheckCircle, XCircle, Clock, DollarSign, Sparkles, TrendingUp, User, LogOut, Router } from 'lucide-react';

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

  useEffect(() => {
    loadPackages();
    loadMyTokens();
  }, []);

  useEffect(() => {
    calculateTodayRevenue();
  }, [myTokens]);

  const loadPackages = async () => {
    try {
      const response = await packageAPI.getAll();
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to load packages:', error);
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
    const today = new Date().toISOString().split('T')[0];
    const todayTokens = myTokens.filter(
      token => token.generated_at?.split('T')[0] === today
    );
    const revenue = todayTokens.reduce((sum, token) => sum + parseFloat(token.price || 0), 0);
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
                  {todayTokens} tokens sold
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Token Generator */}
          <div className="card animate-slide-up">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Generate Token</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {!user?.assigned_router_id ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-4">
                    <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                  </div>
                  <p className="text-red-600 font-semibold text-base sm:text-lg mb-2">No Router Assigned</p>
                  <p className="text-xs sm:text-sm text-gray-500">Please contact your administrator</p>
                </div>
              ) : (
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
            </div>
          </div>

          {/* Recent Tokens */}
          <div className="card animate-slide-up">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Tokens</h2>
                </div>
                <span className="badge-info text-xs sm:text-sm">{myTokens.length}</span>
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
              )}
            </div>
          </div>
        </div>
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
