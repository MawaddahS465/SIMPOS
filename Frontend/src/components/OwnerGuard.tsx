import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { ROLE_HOME } from "../store/session";

/** Rute /owner: wajib sesi Backend role pemilik. */
export default function OwnerGuard({ children }: { children: JSX.Element }) {
  const { session } = useAuth();

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "pemilik") return <Navigate to={ROLE_HOME[session.role]} replace />;

  return children;
}
