import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/auth";
import { ROLE_HOME } from "../store/session";

/** Rute Kasir: wajib sesi Backend role kasir. Direct URL tanpa sesi → /login. */
export default function KasirGuard() {
  const { session } = useAuth();

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "kasir") return <Navigate to={ROLE_HOME[session.role]} replace />;

  return <Outlet />;
}
