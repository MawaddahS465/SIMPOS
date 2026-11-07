import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TransaksiBaruPage from "./pages/TransaksiBaruPage";
import CheckoutPage from "./pages/CheckoutPage";
import TransaksiBerhasilPage from "./pages/TransaksiBerhasilPage";
import PemesananPage from "./pages/PemesananPage";
import DetailPoPage from "./pages/DetailPoPage";
import RiwayatPage from "./pages/RiwayatPage";
import PelangganPage from "./pages/PelangganPage";
import ResepMataPage from "./pages/ResepMataPage";
import AppLayout from "./components/AppLayout";
import KasirGuard from "./components/KasirGuard";
import AdminLayout from "./components/AdminLayout";
import AdminGuard from "./components/AdminGuard";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProdukPage from "./pages/admin/AdminProdukPage";
import AdminStokPage from "./pages/admin/AdminStokPage";
import AdminPenerimaanPage from "./pages/admin/AdminPenerimaanPage";
import AdminPengajuanPage from "./pages/admin/AdminPengajuanPage";
import AdminPemesananPage from "./pages/admin/AdminPemesananPage";
import AdminDetailPoPage from "./pages/admin/AdminDetailPoPage";
import AdminMutasiPage from "./pages/admin/AdminMutasiPage";
import OwnerGuard from "./components/OwnerGuard";
import OwnerLayout from "./components/OwnerLayout";
import OwnerLoginPage from "./pages/owner/OwnerLoginPage";
import OwnerDashboardPage from "./pages/owner/OwnerDashboardPage";
import OwnerCabangPage from "./pages/owner/OwnerCabangPage";
import OwnerCabangDetailPage from "./pages/owner/OwnerCabangDetailPage";
import OwnerStokPage from "./pages/owner/OwnerStokPage";
import OwnerPengajuanPage from "./pages/owner/OwnerPengajuanPage";
import OwnerAlokasiPage from "./pages/owner/OwnerAlokasiPage";
import OwnerMutasiPage from "./pages/owner/OwnerMutasiPage";
import OwnerTransaksiPage from "./pages/owner/OwnerTransaksiPage";
import OwnerPOPage from "./pages/owner/OwnerPOPage";
import OwnerLaporanPage from "./pages/owner/OwnerLaporanPage";
import OwnerPengaturanPage from "./pages/owner/OwnerPengaturanPage";
import TitleSync from "./components/TitleSync";
import ScrollToTop from "./components/ScrollToTop";
import AsciiReveal from "./components/AsciiReveal";
import { CartProvider } from "./context/CartContext";
import { SharedProvider } from "./store/sharedStore";
import { AuthProvider, useAuth } from "./store/auth";
import { ROLE_HOME } from "./store/session";

function AuthBootScreen() {
  return (
    <div className="page-bg" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div
        aria-label="Memeriksa sesi"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontWeight: 600 }}
      >
        <span
          className="spinner"
          style={{ borderColor: "rgba(10, 74, 111, 0.2)", borderTopColor: "#0a4a6f" }}
        />
        <span>Memeriksa sesi...</span>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { session } = useAuth();
  return <Navigate to={session ? ROLE_HOME[session.role] : "/login"} replace />;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (session) return <Navigate to={ROLE_HOME[session.role]} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { status } = useAuth();

  // Tunggu GET /api/me selesai sebelum merender route agar tidak berkedip
  // dari halaman login ke dashboard (atau sebaliknya).
  if (status === "checking") return <AuthBootScreen />;

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route element={<KasirGuard />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transaksi-baru" element={<TransaksiBaruPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/transaksi-berhasil" element={<TransaksiBerhasilPage />} />
          <Route path="/pemesanan" element={<PemesananPage />} />
          <Route path="/pemesanan/:id" element={<DetailPoPage />} />
          <Route path="/riwayat-transaksi" element={<RiwayatPage />} />
          <Route path="/pembayaran" element={<Navigate to="/riwayat-transaksi" replace />} />
          <Route path="/pelanggan" element={<PelangganPage />} />
          <Route path="/resep-mata" element={<ResepMataPage />} />
        </Route>
      </Route>
      {/* ADMIN CABANG — Tahap 01. Rute Kasir di atas tidak diubah. */}
      <Route
        path="/admin/login"
        element={
          <GuestOnly>
            <AdminLoginPage />
          </GuestOnly>
        }
      />
      <Route
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/produk/frame" element={<AdminProdukPage type="Frame" />} />
        <Route path="/admin/produk/lensa" element={<AdminProdukPage type="Lensa" />} />
        <Route path="/admin/stok" element={<AdminStokPage />} />
        <Route path="/admin/penerimaan" element={<AdminPenerimaanPage />} />
        <Route path="/admin/pengajuan" element={<AdminPengajuanPage />} />
        <Route path="/admin/pemesanan" element={<AdminPemesananPage />} />
        <Route path="/admin/pemesanan/:id" element={<AdminDetailPoPage />} />
        <Route path="/admin/mutasi" element={<AdminMutasiPage />} />
      </Route>
      {/* PEMILIK — Tahap 04 Checkpoint 1. Rute Kasir & Admin di atas tidak diubah. */}
      <Route
        path="/owner/login"
        element={
          <GuestOnly>
            <OwnerLoginPage />
          </GuestOnly>
        }
      />
      <Route
        element={
          <OwnerGuard>
            <OwnerLayout />
          </OwnerGuard>
        }
      >
        <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
        <Route path="/owner/cabang" element={<OwnerCabangPage />} />
        <Route path="/owner/cabang/:id" element={<OwnerCabangDetailPage />} />
        <Route path="/owner/stok" element={<OwnerStokPage />} />
        <Route path="/owner/pengajuan" element={<OwnerPengajuanPage />} />
        <Route path="/owner/alokasi" element={<OwnerAlokasiPage />} />
        <Route path="/owner/mutasi" element={<OwnerMutasiPage />} />
        <Route path="/owner/transaksi" element={<OwnerTransaksiPage />} />
        <Route path="/owner/pemesanan" element={<OwnerPOPage />} />
        <Route path="/owner/laporan" element={<OwnerLaporanPage />} />
        <Route path="/owner/pengaturan" element={<OwnerPengaturanPage />} />
      </Route>
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SharedProvider>
        <CartProvider>
          <AsciiReveal />
          <TitleSync />
          <ScrollToTop />
          <AppRoutes />
        </CartProvider>
      </SharedProvider>
    </AuthProvider>
  );
}
