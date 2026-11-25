import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute, getDefaultRouteForRole } from '@/components/layout/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { mockBranchService } from '@/api';

// Core Pages
import LoginPage from '@/pages/auth/LoginPage';
import PatientQueuePage from '@/pages/reception/PatientQueuePage';
import PatientRegisterPage from '@/pages/reception/PatientRegisterPage';
import AppointmentCalendarPage from '@/pages/reception/AppointmentCalendarPage';
import FollowUpQueuePage from '@/pages/reception/FollowUpQueuePage';
import DoctorWorkbenchPage from '@/pages/clinical/DoctorWorkbenchPage';
import LabOrdersPage from '@/pages/lab/LabOrdersPage';
import PackagesPage from '@/pages/aesthetic/PackagesPage';
import PhotoVaultPage from '@/pages/aesthetic/PhotoVaultPage';
import DaycareLoungePage from '@/pages/daycare/DaycareLoungePage';
import BillingPOSPage from '@/pages/billing/BillingPOSPage';
import CashierShiftPage from '@/pages/billing/CashierShiftPage';
import LedgerPage from '@/pages/billing/LedgerPage';
import PharmacyDispensaryPage from '@/pages/pharmacy/PharmacyDispensaryPage';
import ProcurementInventoryPage from '@/pages/inventory/ProcurementInventoryPage';
import DutyRosterCommissionPage from '@/pages/hrms/DutyRosterCommissionPage';
import HRMSPage from '@/pages/hrms/HRMSPage';
import DashboardPage from '@/pages/reports/DashboardPage';
import CollectionReportPage from '@/pages/reports/CollectionReportPage';
import BillingReportPage from '@/pages/reports/BillingReportPage';
import AuditTrailPage from '@/pages/reports/AuditTrailPage';
import PatientDirectoryPage from '@/pages/masters/PatientDirectoryPage';
import DoctorsStaffPage from '@/pages/masters/DoctorsStaffPage';
import MedicineMasterPage from '@/pages/masters/MedicineMasterPage';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
});

// Dedicated Gateway for Investor Clean Links: /1, /2, /3, /4
function BranchRouteHandler({ branchId, target = "/reception/queue" }: { branchId: string; target?: string }) {
  const { isAuthenticated } = useAuthStore();
  
  mockBranchService.setActiveBranch(branchId);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', branchId);
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={target} replace />;
}

function RootRouteHandler() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Clean Investor Branch Entry Routes */}
          <Route path="/1" element={<BranchRouteHandler branchId="krn-branch-001" target="/reception/queue" />} />
          <Route path="/2" element={<BranchRouteHandler branchId="clt-branch-002" target="/reception/queue" />} />
          <Route path="/3" element={<BranchRouteHandler branchId="wyd-branch-003" target="/reception/queue" />} />
          <Route path="/4" element={<BranchRouteHandler branchId="all" target="/reports/dashboard" />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RootRouteHandler />} />
            
            {/* 1. Reception & Outpatients */}
            <Route path="/reception/register"         element={<PatientRegisterPage />} />
            <Route path="/reception/queue"            element={<PatientQueuePage />} />
            <Route path="/reception/calendar"         element={<AppointmentCalendarPage />} />
            <Route path="/reception/followups"        element={<FollowUpQueuePage />} />

            {/* 2. Clinical EMR */}
            <Route path="/clinical/workbench"         element={<DoctorWorkbenchPage />} />
            <Route path="/clinical/workbench/:apptId" element={<DoctorWorkbenchPage />} />
            <Route path="/clinical/lab"               element={<LabOrdersPage />} />

            {/* 3. Aesthetic Care */}
            <Route path="/aesthetic/packages"         element={<PackagesPage />} />
            <Route path="/aesthetic/photos"           element={<PhotoVaultPage />} />

            {/* 4. Daycare & Minor Procedures */}
            <Route path="/daycare/lounges"            element={<DaycareLoungePage />} />

            {/* 5. Billing & POS */}
            <Route path="/billing/pos"                element={<BillingPOSPage />} />
            <Route path="/billing/pos/:billId"        element={<BillingPOSPage />} />
            <Route path="/billing/shifts"             element={<CashierShiftPage />} />
            <Route path="/billing/ledger"             element={<LedgerPage />} />

            {/* 6. Pharmacy & Dispensary */}
            <Route path="/pharmacy/dispensary"        element={<PharmacyDispensaryPage />} />

            {/* 7. Procurement & Consumables */}
            <Route path="/inventory/transfers"        element={<ProcurementInventoryPage />} />

            {/* 8. HRMS & Workforce Management Suite */}
            <Route path="/hrms"                       element={<HRMSPage />} />
            <Route path="/hrms/commissions"           element={<DutyRosterCommissionPage />} />
            <Route path="/hrms/:tab"                  element={<HRMSPage />} />

            {/* 9. Reports & Forensic Audit */}
            <Route path="/reports/dashboard"          element={<DashboardPage />} />
            <Route path="/reports/collection"         element={<CollectionReportPage />} />
            <Route path="/reports/billing"            element={<BillingReportPage />} />
            <Route path="/reports/audit-trail"        element={<AuditTrailPage />} />

            {/* 10. Master Data Catalogs */}
            <Route path="/masters/patients"           element={<PatientDirectoryPage />} />
            <Route path="/masters/doctors"            element={<DoctorsStaffPage />} />
            <Route path="/masters/medicines"          element={<MedicineMasterPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
