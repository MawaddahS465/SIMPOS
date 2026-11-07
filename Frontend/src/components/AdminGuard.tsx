import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { ROLE_HOME } from "../store/session";

/** Penjaga rute /admin — role dari session Backend, bukan localStorage. */
export default function AdminGuard({ children }: { children: JSX.Element }) {
  const { session } = useAuth();

  if (!session) return <Navigate to="/admin/login" replace />;
  if (session.role !== "admin") return <Navigate to={ROLE_HOME[session.role]} replace />;

  return children;
}
