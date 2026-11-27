import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import PharmacyDispensaryPage from '@/pages/pharmacy/PharmacyDispensaryPage';
import BatchInventoryPage from '@/pages/pharmacy/BatchInventoryPage';
import ProcurementPOPage from '@/pages/pharmacy/ProcurementPOPage';
import ExpiryReturnsPage from '@/pages/pharmacy/ExpiryReturnsPage';
import MedicineMasterPage from '@/pages/masters/MedicineMasterPage';
import RegulatoryAuditVaultPage from '@/pages/pharmacy/RegulatoryAuditVaultPage';

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
            
            {/* 1. Dispensing & Counter POS */}
            <Route path="/pharmacy/dispensary" element={<PharmacyDispensaryPage />} />
            
            {/* 2. Batches, FEFO & Aesthetic Vial Splitting */}
            <Route path="/pharmacy/batches" element={<BatchInventoryPage />} />
            
            {/* 3. Procurement, PO, Bonus Scheme & GRN */}
            <Route path="/pharmacy/procurement" element={<ProcurementPOPage />} />
            <Route path="/inventory/pos" element={<ProcurementPOPage />} />
            <Route path="/inventory/transfers" element={<ProcurementPOPage />} />
            <Route path="/inventory/vendors" element={<ProcurementPOPage />} />
            
            {/* 4. Expiry Returns & Debit Notes */}
            <Route path="/pharmacy/expiry-returns" element={<ExpiryReturnsPage />} />
            
            {/* 5. Formulary, Salts & HSN Master */}
            <Route path="/masters/medicines" element={<MedicineMasterPage />} />
            
            {/* 6. Schedule H1, Isotretinoin & Indian GST Regulatory Vault */}
            <Route path="/pharmacy/regulatory-vault" element={<RegulatoryAuditVaultPage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/pharmacy/dispensary" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
