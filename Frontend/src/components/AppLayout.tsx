import { useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Search, Menu as MenuIcon } from "lucide-react";
import { PRIMARY_NAV, SECONDARY_NAV } from "../data/nav";
import MRLogo from "../components/MRLogo";
import { useAuth } from "../store/auth";
import { ROLE_LABEL } from "../store/session";
import NotificationBell from "./NotificationBell";
import "../styles/layout.css";
import "../styles/admin.css";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  // Search topbar hanya di Dashboard; disembunyikan di Transaksi Baru agar tidak duplikat dengan toolbar katalog.
  const showSearch = location.pathname === "/dashboard";

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/transaksi-baru?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const { session, signOut } = useAuth();

  const logout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-bg app-shell notranslate" translate="no">
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
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <item.icon size={19} strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}

            <div className="nav-sep" />

            {SECONDARY_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <item.icon size={19} strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-foot">
            <b>{session?.branch ?? "Cabang"}</b>
            <span>{session ? ROLE_LABEL[session.role] : "Kasir"}</span>
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
              <form className="search-field" onSubmit={submitSearch} role="search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Cari produk, pelanggan, atau transaksi..."
                  aria-label="Pencarian"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="kbd">Enter</span>
              </form>
            ) : null}

            <div className="topbar-right">
              <NotificationBell role="kasir" />
              <div className="profile">
                <span className="avatar">{session?.initials ?? "K"}</span>
                <span className="profile-text">
                  <b>{session?.name ?? "Kasir"}</b>
                  <span>{session ? ROLE_LABEL[session.role] : "Kasir"}</span>
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
