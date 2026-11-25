import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import PharmacyDispensaryPage from '@/pages/pharmacy/PharmacyDispensaryPage';
import ProcurementInventoryPage from '@/pages/inventory/ProcurementInventoryPage';
import MedicineMasterPage from '@/pages/masters/MedicineMasterPage';

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
            <Route path="/" element={<Navigate to="/pharmacy/dispensary" replace />} />
            <Route path="/pharmacy" element={<Navigate to="/pharmacy/dispensary" replace />} />
            <Route path="/pharmacy/dispensary" element={<PharmacyDispensaryPage />} />
            <Route path="/pharmacy/batches" element={<PharmacyDispensaryPage />} />
            <Route path="/inventory/transfers" element={<ProcurementInventoryPage />} />
            <Route path="/inventory/pos" element={<ProcurementInventoryPage />} />
            <Route path="/inventory/vendors" element={<ProcurementInventoryPage />} />
            <Route path="/masters/medicines" element={<MedicineMasterPage />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/pharmacy/dispensary" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
