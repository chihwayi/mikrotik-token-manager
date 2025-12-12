import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './components/common/Login';
import SuperAdminDashboard from './components/dashboards/SuperAdminDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';
import StaffDashboard from './components/dashboards/StaffDashboard';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" />} />
      <Route 
        path="/" 
        element={
          <PrivateRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/manager" 
        element={
          <PrivateRoute allowedRoles={['manager', 'super_admin']}>
            <ManagerDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/staff" 
        element={
          <PrivateRoute allowedRoles={['staff', 'manager', 'super_admin']}>
            <StaffDashboard />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

