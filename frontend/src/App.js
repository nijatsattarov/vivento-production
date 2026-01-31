import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import './i18n';
import { Toaster } from "./components/ui/sonner";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EventDetail from "./pages/EventDetail";
import TemplateEditor from "./pages/TemplateEditor";
import InvitationPage from "./pages/InvitationPage";
import AdminPanel from "./pages/AdminPanel";
import Templates from "./pages/Templates";
import TemplateDetail from "./pages/TemplateDetail";
import AddBalance from "./pages/AddBalance";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentResult from "./pages/PaymentResult";
import PaymentError from "./pages/PaymentError";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import Features from "./pages/Features";
import Terms from "./pages/Terms";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminPages from "./pages/AdminPages";
import PublicPage from "./pages/PublicPage";
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
      <Route 
        path="/forgot-password" 
        element={
          isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <ForgotPassword />
        } 
      />
      <Route path="/invite/:token" element={<InvitationPage />} />
      
      {/* Template routes */}
      <Route path="/templates" element={<Templates />} />
      <Route path="/templates/:parent/:sub" element={<Templates />} />
      <Route path="/templates/:parent" element={<Templates />} />
      <Route path="/template/:templateId" element={<TemplateDetail />} />
      
      {/* Features page */}
      <Route path="/features" element={<Features />} />
      
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
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/pages" 
        element={
          <ProtectedRoute>
            <AdminPages />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/add-balance" 
        element={
          <ProtectedRoute>
            <AddBalance />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/payment-success" 
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/payment-cancel" 
        element={
          <ProtectedRoute>
            <PaymentCancel />
          </ProtectedRoute>
        } 
      />
      
      {/* Epoint.az callback URLs */}
      <Route 
        path="/success" 
        element={
          <ProtectedRoute>
            <PaymentResult />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/result" 
        element={
          <ProtectedRoute>
            <PaymentResult />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/error" 
        element={
          <ProtectedRoute>
            <PaymentError />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/favorites" 
        element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/support" element={<Support />} />
      <Route path="/privacy" element={<PublicPage />} />
      <Route path="/terms" element={<PublicPage />} />
      <Route path="/page/:slug" element={<PublicPage />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      
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
      <SiteSettingsProvider>
        <Router>
          <div className="App min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            <AppRoutes />
            <Toaster position="top-right" />
          </div>
        </Router>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}

export default App;