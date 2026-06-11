import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/shared/ProtectedRoute'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Menu from './pages/Menu'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AcceptInvite from './pages/AcceptInvite'
import { SuperAdmin } from './pages/SuperAdmin'
import LoginTenant from './pages/LoginTenant'

import { isRootDomain } from './lib/tenant'

const rootRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Login />
      </ErrorBoundary>
    ),
  },
  {
    path: '/superadmin',
    element: (
      <ErrorBoundary>
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdmin />
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '*',
    element: <Login />,
  },
])

const tenantRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Menu />
      </ErrorBoundary>
    ),
  },
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <LoginTenant />
      </ErrorBoundary>
    ),
  },
  {
    path: '/register',
    element: (
      <ErrorBoundary>
        <Register />
      </ErrorBoundary>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <ErrorBoundary>
        <ForgotPassword />
      </ErrorBoundary>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <ErrorBoundary>
        <ResetPassword />
      </ErrorBoundary>
    ),
  },
  {
    path: '/accept-invite',
    element: (
      <ErrorBoundary>
        <AcceptInvite />
      </ErrorBoundary>
    ),
  },
  {
    path: '/admin',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '*',
    element: (
      <ErrorBoundary>
        <Menu />
      </ErrorBoundary>
    ), // Fallback unknown paths to public menu
  },
])

export function App() {
  const router = isRootDomain() ? rootRouter : tenantRouter

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
