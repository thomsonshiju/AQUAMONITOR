import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import DeviceStatus from './pages/DeviceStatus';
import Automation from './pages/Automation';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AutomationProvider } from './context/AutomationContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          user?.role?.toLowerCase() === 'admin' ? <Admin /> : <Dashboard />
        } />
        <Route path="status" element={<DeviceStatus />} />
        <Route path="automation" element={<Automation />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        } />
      </Route>
    </Routes>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AutomationProvider>
          <AppRoutes />
        </AutomationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
