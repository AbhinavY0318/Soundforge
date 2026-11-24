import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { DashboardLayout } from './layouts/DashboardLayout.js';

// Public Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.js';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.js';

// Dashboard Pages
import { OverviewPage } from './pages/dashboard/OverviewPage.js';
import { GenerationsPage } from './pages/dashboard/GenerationsPage.js';
import { ApiKeysPage } from './pages/dashboard/ApiKeysPage.js';
import { UsagePage } from './pages/dashboard/UsagePage.js';
import { WebhooksPage } from './pages/dashboard/WebhooksPage.js';
import { DocsPage } from './pages/dashboard/DocsPage.js';
import { SettingsPage } from './pages/dashboard/SettingsPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="generations" element={<GenerationsPage />} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              <Route path="usage" element={<UsagePage />} />
              <Route path="webhooks" element={<WebhooksPage />} />
              <Route path="docs" element={<DocsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
