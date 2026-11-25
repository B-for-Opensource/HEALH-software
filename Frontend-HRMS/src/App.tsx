import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import HRMSPage from '@/pages/hrms/HRMSPage';
import DutyRosterCommissionPage from '@/pages/hrms/DutyRosterCommissionPage';
import DoctorsStaffPage from '@/pages/masters/DoctorsStaffPage';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/hrms/dashboard" replace />} />
            <Route path="/hrms" element={<HRMSPage />} />
            <Route path="/hrms/dashboard" element={<HRMSPage />} />
            <Route path="/hrms/commissions" element={<DutyRosterCommissionPage />} />
            <Route path="/hrms/:tab" element={<HRMSPage />} />
            <Route path="/masters/doctors" element={<DoctorsStaffPage />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/hrms/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
