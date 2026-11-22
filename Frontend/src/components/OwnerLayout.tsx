import { useEffect, useRef, useState, type FormEvent } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ChevronDown, Eye, EyeOff, KeyRound, LogOut, Menu as MenuIcon, X } from "lucide-react";
import { OWNER_NAV } from "../data/owner";
import { useAuth } from "../store/auth";
import { ROLE_LABEL } from "../store/session";
import MRLogo from "./MRLogo";
import NotificationBell from "./NotificationBell";
import { useSharedStore } from "../store/sharedStore";
import { ApiError, ownerManagementApi } from "../lib/api";
import "../styles/layout.css";
import "../styles/admin.css";
import "../styles/owner-settings.css";

const EMPTY_PASSWORD = { current: "", next: "", confirm: "" };

function passwordStrength(value: string): { score: number; label: string } {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const labels = ["Lemah", "Cukup", "Sedang", "Kuat", "Sangat Kuat"];
  return { score, label: labels[score] };
}

/** Shell Pemilik — kelas/geometri layout.css yang sama dengan Kasir & Admin. */
export default function OwnerLayout() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const ownerData = useSharedStore();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = passwordStrength(passwordForm.next);

  const logout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (passwordOpen && !passwordSaving) {
        setPasswordOpen(false);
        setPasswordError("");
        return;
      }
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [passwordOpen, passwordSaving]);

  useEffect(() => {
    if (!passwordNotice) return;
    const timer = window.setTimeout(() => setPasswordNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [passwordNotice]);

  const openPassword = () => {
    setMenuOpen(false);
    setPasswordForm(EMPTY_PASSWORD);
    setPasswordError("");
    setShowPassword(false);
    setPasswordOpen(true);
  };

  const closePassword = () => {
    if (passwordSaving) return;
    setPasswordOpen(false);
    setPasswordError("");
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    if (passwordForm.next.length < 8) {
      setPasswordError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("Konfirmasi kata sandi baru belum sama.");
      return;
    }

    setPasswordSaving(true);
    try {
      await ownerManagementApi.changePassword(passwordForm.current, passwordForm.next);
      setPasswordOpen(false);
      setPasswordForm(EMPTY_PASSWORD);
      setPasswordNotice("Kata sandi berhasil diperbarui.");
    } catch (error) {
      setPasswordError(error instanceof ApiError ? error.message : "Kata sandi gagal diperbarui.");
    } finally {
      setPasswordSaving(false);
    }
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
              <div className="profile profile-menu" ref={menuRef}>
                <button
                  className="profile-btn"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((current) => !current)}
                >
                  <span className="avatar">{session?.initials ?? "P"}</span>
                  <span className="profile-text">
                    <b>{session?.name ?? "Pemilik"}</b>
                    <span>{session ? ROLE_LABEL[session.role] : "Pemilik"}</span>
                  </span>
                  <ChevronDown size={16} className="profile-caret" />
                </button>

                {menuOpen ? (
                  <div className="profile-dropdown" role="menu" aria-label="Menu akun">
                    <button type="button" role="menuitem" onClick={openPassword}>
                      <KeyRound size={16} />
                      Ubah Kata Sandi
                    </button>
                    <button type="button" role="menuitem" className="is-danger" onClick={() => void logout()}>
                      <LogOut size={16} />
                      Keluar
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {passwordNotice ? (
            <div className="notice notice-ok" role="status" style={{ margin: "0 34px 8px" }}>
              {passwordNotice}
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={() => setPasswordNotice("")} style={{ marginLeft: "auto" }}>
                <X size={14} />
              </button>
            </div>
          ) : null}

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

      {passwordOpen ? (
        <div className="overlay" onClick={closePassword}>
          <div
            className="os-modal os-modal-sm"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-password-title"
          >
            <div className="os-modal-head">
              <div>
                <h2 id="owner-password-title">Ubah Kata Sandi</h2>
                <p>Berlaku untuk akun yang sedang Anda gunakan.</p>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={closePassword} disabled={passwordSaving}>
                <X size={18} />
              </button>
            </div>
            <form className="os-modal-body" onSubmit={submitPassword} noValidate>
              {passwordError ? <div className="form-error" role="alert">{passwordError}</div> : null}
              <label className="os-field">
                <span>Kata Sandi Saat Ini</span>
                <div className="os-input-wrap">
                  <input
                    className="os-input"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.current}
                    onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })}
                    autoComplete="current-password"
                    autoFocus
                  />
                  <button
                    className="os-eye"
                    type="button"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="os-field">
                <span>Kata Sandi Baru</span>
                <div className="os-input-wrap">
                  <input
                    className="os-input"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.next}
                    onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })}
                    autoComplete="new-password"
                  />
                </div>
                <div className="os-strength" data-score={strength.score}>
                  <div className="os-strength-head">
                    <span>Kekuatan Sandi:</span>
                    <b>{strength.label}</b>
                  </div>
                  <div className="os-strength-track">
                    {[1, 2, 3, 4].map((step) => (
                      <span key={step} className={step <= strength.score ? "is-filled" : ""} />
                    ))}
                  </div>
                </div>
              </label>
              <label className="os-field">
                <span>Konfirmasi Kata Sandi Baru</span>
                <div className="os-input-wrap">
                  <input
                    className="os-input"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.confirm}
                    onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })}
                    autoComplete="new-password"
                  />
                </div>
              </label>
              <div className="os-modal-actions">
                <button className="btn btn-ghost" type="button" onClick={closePassword} disabled={passwordSaving}>
                  Batal
                </button>
                <button className="btn btn-primary" type="submit" disabled={passwordSaving}>
                  {passwordSaving ? "Menyimpan..." : "Simpan Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
