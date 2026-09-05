import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PageLayout from '../components/layout/PageLayout';

// Features
import AuthPage from '../features/auth/pages/AuthPage';
import UploadReportPage from '../features/reports/pages/UploadReportPage';
import DashboardPage from '../features/reports/pages/DashboardPage';
import TrendsPage from '../features/health-insights/pages/TrendsPage';
import TrendDetailPage from '../features/health-insights/pages/TrendDetailPage';
import RecommendationsPage from '../features/health-insights/pages/RecommendationsPage';
import DietPlanPage from '../features/diet-plan/pages/DietPlanPage';
import CategorySelectionPage from '../features/patients/pages/CategorySelectionPage';
import ProfileListPage from '../features/patients/pages/ProfileListPage';
import ProfileForm from '../features/patients/components/ProfileForm';
import SharingSettingsPage from '../features/shared-links/pages/SharingSettingsPage';
import SharedReportViewPage from '../features/shared-links/pages/SharedReportViewPage';

export const routes = [
  {
    path: '/',
    element: <Navigate to="/category" replace />,
  },
  {
    path: '/category',
    element: (
      <ProtectedRoute>
        <CategorySelectionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/upload',
    element: (
      <ProtectedRoute>
        <UploadReportPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/diet-plan',
    element: (
      <ProtectedRoute>
        <DietPlanPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/:reportId/diet-plan',
    element: (
      <ProtectedRoute>
        <DietPlanPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profiles',
    element: (
      <ProtectedRoute>
        <ProfileListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profiles/new',
    element: (
      <ProtectedRoute>
        <PageLayout>
          <div style={{ padding: '24px 0' }}>
            <ProfileForm />
          </div>
        </PageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/trends',
    element: (
      <ProtectedRoute>
        <TrendsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profiles/:profileId/trends',
    element: (
      <ProtectedRoute>
        <TrendsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profiles/:profileId/trends/:testName',
    element: (
      <ProtectedRoute>
        <TrendDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sharing',
    element: (
      <ProtectedRoute>
        <SharingSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profiles/:profileId/sharing',
    element: (
      <ProtectedRoute>
        <SharingSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/shared/:token',
    element: <SharedReportViewPage />,
  },
  {
    path: '/reports/:reportId/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/report/:reportId',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/:reportId/recommendations',
    element: (
      <ProtectedRoute>
        <RecommendationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Navigate to="/upload" replace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/signup',
    element: <AuthPage />,
  },
];

export const router = createBrowserRouter(routes);

export default router;
