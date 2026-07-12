import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '../constants';

// Authentication Pages
import { SplashScreen } from '../pages/auth/SplashScreen';
import { LandingPage } from '../pages/auth/LandingPage';
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { ForgotPassword } from '../pages/auth/ForgotPassword';

// Dashboard & Core Pages
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Departments } from '../pages/organization/Departments';
import { Employees } from '../pages/organization/Employees';
import { Roles } from '../pages/organization/Roles';
import { AssetCategories } from '../pages/assets/AssetCategories';
import { Assets } from '../pages/assets/Assets';
import { AssetDetails } from '../pages/assets/AssetDetails';
import { RegisterAsset } from '../pages/assets/RegisterAsset';
import { Allocations } from '../pages/operations/Allocations';
import { Bookings } from '../pages/operations/Bookings';
import { Maintenance } from '../pages/operations/Maintenance';
import { Audits } from '../pages/operations/Audits';
import { Reports } from '../pages/reports/Reports';
import { Notifications } from '../pages/notifications/Notifications';
import { ActivityLogs } from '../pages/ActivityLogs';
import { Settings } from '../pages/settings/Settings';
import { ProfileSettings } from '../pages/settings/Profile';
import { NotFound } from '../pages/NotFound';

export const router = createBrowserRouter([
  // Splash Loading initial Page
  {
    path: '/',
    element: <SplashScreen />,
  },

  // Portal Entrance Landing Page
  {
    path: '/landing',
    element: <LandingPage />,
  },

  // Auth pages (Signup, login, forgot password)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ],
  },

  // Protected Core Workspace (requires valid JWT session)
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      {
        path: '/admin/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/asset-manager/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASSET_MANAGER]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/department-head/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DEPARTMENT_HEAD]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employee/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EMPLOYEE]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },

      // Organization
      {
        path: '/departments',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Departments />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employees',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DEPARTMENT_HEAD]}>
            <Employees />
          </ProtectedRoute>
        ),
      },
      {
        path: '/roles',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Roles />
          </ProtectedRoute>
        ),
      },

      // Assets
      {
        path: '/asset-categories',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASSET_MANAGER]}>
            <AssetCategories />
          </ProtectedRoute>
        ),
      },
      { path: '/assets', element: <Assets /> },
      { path: '/assets/:id', element: <AssetDetails /> },
      {
        path: '/assets/new',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASSET_MANAGER]}>
            <RegisterAsset />
          </ProtectedRoute>
        ),
      },
      {
        path: '/assets/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASSET_MANAGER]}>
            <RegisterAsset />
          </ProtectedRoute>
        ),
      },

      // Operations
      {
        path: '/allocations',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD]}>
            <Allocations />
          </ProtectedRoute>
        ),
      },
      { path: '/bookings', element: <Bookings /> },
      { path: '/maintenance', element: <Maintenance /> },
      {
        path: '/audits',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASSET_MANAGER]}>
            <Audits />
          </ProtectedRoute>
        ),
      },

      // Insights
      {
        path: '/reports',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD]}>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: '/activity-logs',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ActivityLogs />
          </ProtectedRoute>
        ),
      },

      // Settings
      { path: '/settings', element: <Settings /> },
      { path: '/settings/profile', element: <ProfileSettings /> },
      { path: '/notifications', element: <Notifications /> },
    ],
  },

  // 404 Route Catch
  {
    path: '*',
    element: <NotFound />,
  },
]);
