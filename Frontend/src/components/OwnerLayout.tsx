import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu as MenuIcon } from "lucide-react";
import { OWNER_NAV } from "../data/owner";
import { useAuth } from "../store/auth";
import { ROLE_LABEL } from "../store/session";
import MRLogo from "./MRLogo";
import NotificationBell from "./NotificationBell";
import { useSharedStore } from "../store/sharedStore";
import "../styles/layout.css";
import "../styles/admin.css";

/** Shell Pemilik — kelas/geometri layout.css yang sama dengan Kasir & Admin. */
export default function OwnerLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const ownerData = useSharedStore();

  const logout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-bg app-shell admin notranslate" translate="no">
      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <div className="app-grid">
        <aside className={`sidebar owner-sidebar ${open ? "open" : ""}`}>
          <div className="sidebar-brand">
            <MRLogo size={44} />
            <span className="brand-text">
              <b>Optik Mekar Jaya</b>
              <span>Sistem Informasi Optik</span>
            </span>
          </div>

          <nav className="sidebar-nav">
            {OWNER_NAV.map((group) => (
              <div key={group.title}>
                <div className="nav-sep">{group.title}</div>
                {group.items.map((item) =>
                  item.ready ? (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      <item.icon size={19} strokeWidth={2} />
                      {item.label}
                    </NavLink>
                  ) : (
                    <span key={item.to} className="nav-item nav-disabled" title="Hadir tahap berikutnya">
                      <item.icon size={19} strokeWidth={2} />
                      {item.label}
                      <em className="nav-soon">Berikutnya</em>
                    </span>
                  ),
                )}
              </div>
            ))}
          </nav>

          <div className="sidebar-foot">
            <b>{session?.branch ?? "Seluruh Cabang"}</b>
            <span>{session ? ROLE_LABEL[session.role] : "Pemilik"}</span>
            <button className="link-action admin-logout" onClick={() => void logout()}>
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </aside>

        <main className="mainpanel">
          <header className="topbar">
            <button className="burger" aria-label="Buka menu" onClick={() => setOpen(true)}>
              <MenuIcon size={20} />
            </button>

            <div className="topbar-right">
              <NotificationBell role="pemilik" />
              <div className="profile">
                <span className="avatar">{session?.initials ?? "P"}</span>
                <span className="profile-text">
                  <b>{session?.name ?? "Pemilik"}</b>
                  <span>{session ? ROLE_LABEL[session.role] : "Pemilik"}</span>
                </span>
              </div>
            </div>
          </header>

          <div className="main-content">
            {ownerData.ownerDataStatus === "loading" || ownerData.ownerDataStatus === "idle" ? (
              <div className="panel empty-note" role="status">Memuat data Pemilik dari server...</div>
            ) : ownerData.ownerDataStatus === "error" ? (
              <div className="notice" role="alert">
                {ownerData.ownerDataError}
                <button className="btn btn-ghost" onClick={() => void ownerData.refreshOwnerData()}>Coba lagi</button>
              </div>
            ) : <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
