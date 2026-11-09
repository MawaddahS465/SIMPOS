import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu as MenuIcon, Search } from "lucide-react";
import { ADMIN_NAV } from "../data/admin";
import { useAuth } from "../store/auth";
import { ROLE_LABEL } from "../store/session";
import MRLogo from "./MRLogo";
import NotificationBell from "./NotificationBell";
import "../styles/layout.css";
import "../styles/admin.css";

/** Shell Admin — memakai kelas/geometri layout.css yang sama dengan Kasir. */
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Search topbar hanya di Dashboard; halaman Admin lain disembunyikan.
  const showSearch = location.pathname === "/admin/dashboard";
  const { session, signOut } = useAuth();

  const logout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-bg app-shell admin notranslate" translate="no">
      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <div className="app-grid">
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <div className="sidebar-brand">
            <MRLogo size={44} />
            <span className="brand-text">
              <b>Optik Mekar Jaya</b>
              <span>Sistem Informasi Optik</span>
            </span>
          </div>

          <nav className="sidebar-nav">
            {ADMIN_NAV.map((group) => (
              <div key={group.title}>
                <div className="nav-sep">{group.title}</div>
                {group.items.map((item) =>
                  item.stage === 2 ? (
                    <span key={item.to} className="nav-item nav-disabled" title="Hadir di Tahap 02">
                      <item.icon size={19} strokeWidth={2} />
                      {item.label}
                      <em className="nav-soon">Segera</em>
                    </span>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      <item.icon size={19} strokeWidth={2} />
                      {item.label}
                    </NavLink>
                  ),
                )}
              </div>
            ))}
          </nav>

          <div className="sidebar-foot">
            <b>{session?.branch ?? "Cabang"}</b>
            <span>{session ? ROLE_LABEL[session.role] : "Admin Cabang"}</span>
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

            {showSearch ? (
              <label className="search-field">
                <Search size={18} />
                <input type="search" placeholder="Cari produk, stok, atau PO..." aria-label="Pencarian" />
                <span className="kbd">Ctrl + K</span>
              </label>
            ) : null}

            <div className="topbar-right">
              <NotificationBell role="admin" />
              <div className="profile">
                <span className="avatar">{session?.initials ?? "A"}</span>
                <span className="profile-text">
                  <b>{session?.name ?? "Admin"}</b>
                  <span>{session ? ROLE_LABEL[session.role] : "Admin Cabang"}</span>
                </span>
              </div>
            </div>
          </header>

          <div className="main-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
