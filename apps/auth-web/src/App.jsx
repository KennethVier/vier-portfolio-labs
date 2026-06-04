import { useState } from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import PrivateRoute from './routes/PrivateRoute';
import Dashboard from './pages/Dashboard';
import authApiService from './api/AuthApiService';
import OAuthSuccess from './pages/OAuthSuccess';

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route 
        path="/auth/oauth2/success" 
        element={
          <OAuthSuccess />
        } 
      />

      {/* Default */}
      <Route
        path="*"
        element={
          <Navigate
            to={authApiService.isAuthenticated() ? "/dashboard" : "/auth"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App
