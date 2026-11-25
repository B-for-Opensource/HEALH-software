import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';

export function isRouteAllowed(pathname: string, userRole?: string): boolean {
  if (!userRole) return false;
  const role = userRole.trim();
  const isSuperUser = ['Super Admin', 'Admin', 'Branch Manager'].includes(role);
  if (isSuperUser) return true;

  // 1. Doctors
  if (role === 'Doctor') {
    // Doctors must NOT access /masters/doctors or /billing/shifts or /reports/audit-trail
    if (
      pathname.startsWith('/masters/doctors') ||
      pathname.startsWith('/billing/shifts') ||
      pathname.startsWith('/reports/audit-trail') ||
      pathname.startsWith('/reception/register')
    ) {
      return false;
    }
    const allowed = [
      '/clinical/workbench',
      '/aesthetic',
      '/daycare',
      '/reception/queue',
      '/reception/calendar',
      '/reception/followups',
      '/masters/patients',
      '/masters/medicines',
      '/hrms/selfservice',
      '/hrms/commissions',
    ];
    return allowed.some((prefix) => pathname.startsWith(prefix));
  }

  // 2. Receptionist
  if (role === 'Receptionist' || role === 'Reception') {
    // Receptionists must NEVER access Doctor Workbench, Doctor Profiles & RBAC, Shifts, Audit Trail, or other doctor details
    if (
      pathname.startsWith('/clinical/workbench') ||
      pathname.startsWith('/masters/doctors') ||
      pathname.startsWith('/billing/shifts') ||
      pathname.startsWith('/reports') ||
      pathname.startsWith('/pharmacy') ||
      pathname.startsWith('/inventory')
    ) {
      return false;
    }
    const allowed = [
      '/reception',
      '/billing/pos',
      '/billing/ledger',
      '/masters/patients',
      '/hrms/selfservice',
    ];
    return allowed.some((prefix) => pathname.startsWith(prefix));
  }

  // 3. Cashier
  if (role === 'Cashier') {
    if (
      pathname.startsWith('/clinical/workbench') ||
      pathname.startsWith('/masters/doctors') ||
      pathname.startsWith('/reception/register') ||
      pathname.startsWith('/reports/audit-trail')
    ) {
      return false;
    }
    const allowed = [
      '/billing',
      '/reports/collection',
      '/reports/billing',
      '/masters/patients',
      '/hrms/selfservice',
    ];
    return allowed.some((prefix) => pathname.startsWith(prefix));
  }

  // 4. Pharmacist
  if (role === 'Pharmacist') {
    const allowed = [
      '/pharmacy',
      '/inventory/transfers',
      '/masters/medicines',
      '/masters/patients',
      '/hrms/selfservice',
    ];
    return allowed.some((prefix) => pathname.startsWith(prefix));
  }

  // 5. Therapist / Nurse
  if (role === 'Therapist' || role === 'Nurse') {
    const allowed = [
      '/daycare',
      '/aesthetic',
      '/reception/queue',
      '/masters/patients',
      '/masters/medicines',
      '/hrms/selfservice',
    ];
    return allowed.some((prefix) => pathname.startsWith(prefix));
  }

  return false;
}

export function getDefaultRouteForRole(userRole?: string): string {
  if (!userRole) return '/login';
  const role = userRole.trim();
  if (role === 'Doctor') return '/clinical/workbench';
  if (role === 'Cashier') return '/billing/pos';
  if (role === 'Pharmacist') return '/pharmacy/dispensary';
  if (role === 'Therapist' || role === 'Nurse') return '/daycare/lounges';
  return '/reception/queue';
}

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Enforce Role-Based Access Control on page routes
  if (user && location.pathname !== '/' && !isRouteAllowed(location.pathname, user.role)) {
    const defaultRoute = getDefaultRouteForRole(user.role);
    return <Navigate to={defaultRoute} replace />;
  }

  return <AppLayout><Outlet /></AppLayout>;
}
