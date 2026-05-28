// import logo from './logo.svg';
// import './App.css';
import VerifyEmail from './pages/VerifyEmail';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import CheckEmail from './pages/CheckEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import { AuthProvider } from './context/AuthContext';
import Businesses    from './pages/Businesses';
import BusinessDetail from './pages/BusinessDetail';
import ProtectedRoute from './components/ProtectedRoute';
import ResponsiveLayout from './components/ResponsiveLayout';
import BranchDashboard from './pages/BranchDashboard';
import Products from './pages/Products';
import RecordSale from './pages/RecordSale';
import RecordRestock from './pages/RecordRestock';
import SalesHistory from './pages/SalesHistory';
import Analytics from './pages/Analytics';
import BranchMembers from './pages/BranchMembers';
import Profile from './pages/Profile';
import { PrivilegeProvider } from './context/PrivilegeContext';
import RolePrivileges from './pages/RolePrivileges';
import CreditManager from './pages/CreditManager';


function App() {
  return (
    <AuthProvider>
      <PrivilegeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/verify-email"   element={<VerifyEmail />} />
            <Route path="/check-email"    element={<CheckEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <ResponsiveLayout><Dashboard /></ResponsiveLayout>
              </ProtectedRoute>
            } />

            <Route path="/businesses" element={
                <ProtectedRoute>
                  <ResponsiveLayout><Businesses /></ResponsiveLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ResponsiveLayout><Profile /></ResponsiveLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/businesses/:businessId" element={
                <ProtectedRoute>
                  <ResponsiveLayout><BusinessDetail /></ResponsiveLayout>
                </ProtectedRoute>
              } />

              <Route path="/businesses/:businessId/branches/:branchId/sales" element={
                <ProtectedRoute>
                  <ResponsiveLayout><SalesHistory /></ResponsiveLayout>
                </ProtectedRoute>
              } />

              <Route path="/businesses/:businessId/branches/:branchId" element={
                <ProtectedRoute>
                  <ResponsiveLayout><BranchDashboard /></ResponsiveLayout>
                </ProtectedRoute>
              } />
              // Business-wide analytics

              <Route path="/businesses/:businessId/analytics" element={
                <ProtectedRoute>
                <ResponsiveLayout><Analytics /></ResponsiveLayout>
                </ProtectedRoute>
              } />

              // Branch analytics
              <Route path="/businesses/:businessId/branches/:branchId/analytics" element={
                <ProtectedRoute>
                  <ResponsiveLayout><Analytics /></ResponsiveLayout>
                </ProtectedRoute>
              } />

              <Route path="/businesses/:businessId/branches/:branchId/members" element={
                <ProtectedRoute>
                  <ResponsiveLayout><BranchMembers /></ResponsiveLayout>
                </ProtectedRoute>
              } />

              <Route path="/businesses/:businessId/privileges" element={
                <ProtectedRoute>
                  <ResponsiveLayout><RolePrivileges /></ResponsiveLayout>
                </ProtectedRoute>
              } />
              <Route path="/businesses/:businessId/credit" element={
                <ProtectedRoute>
                  <ResponsiveLayout><CreditManager /></ResponsiveLayout>
                </ProtectedRoute>
              } />

              <Route path="/businesses/:businessId/branches/:branchId/restock/new" element={
    <ProtectedRoute>
      <ResponsiveLayout><RecordRestock /></ResponsiveLayout>
    </ProtectedRoute>
  } />

  <Route path="/businesses/:businessId/products" element={
    <ProtectedRoute>
      <ResponsiveLayout><Products /></ResponsiveLayout>
    </ProtectedRoute>
  } />
  <Route path="/businesses/:businessId/branches/:branchId/sales/new" element={
    <ProtectedRoute>
      <ResponsiveLayout><RecordSale /></ResponsiveLayout>
    </ProtectedRoute>
  } />

  <Route path="/businesses/:businessId/branches/:branchId/products" element={
    <ProtectedRoute>
      <ResponsiveLayout><Products /></ResponsiveLayout>
    </ProtectedRoute>
  } />
            <Route path="/" element={<Navigate to="/dashboard" />} />

          </Routes>
        </BrowserRouter>
      </PrivilegeProvider>  
    </AuthProvider>
  );
}

export default App;
