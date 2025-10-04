import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EventDetail from "./pages/EventDetail";
import TemplateEditor from "./pages/TemplateEditor";
import InvitationPage from "./pages/InvitationPage";
import AdminPanel from "./pages/AdminPanel";
import LoadingSpinner from "./components/LoadingSpinner";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <LoginPage />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <RegisterPage />
        } 
      />
      <Route path="/invite/:token" element={<InvitationPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-event" 
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/events/:eventId" 
        element={
          <ProtectedRoute>
            <EventDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/editor/:eventId" 
        element={
          <ProtectedRoute>
            <TemplateEditor />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback */}
      <Route 
        path="*" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;