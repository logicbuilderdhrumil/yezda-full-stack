/**
 * Dashboard Feature Module
 *
 * Encapsulates admin home dashboard, widgets, and services.
 */

// Pages
export { HomeView } from './pages/HomeView';

// Widgets
export { KPICard } from './pages/KPICard';
export { ActivityFeed } from './pages/ActivityFeed';
export { ChartWidget } from './pages/ChartWidget';

// Services
export { DashboardService } from './services/DashboardService';

// Hooks
export { useDashboard } from './hooks/useDashboard';
