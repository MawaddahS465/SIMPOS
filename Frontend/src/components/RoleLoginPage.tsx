import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBigUp, Eye, EyeOff, Lock, User } from "lucide-react";
import MRLogo from "./MRLogo";
import { ApiError } from "../lib/api";
import { assetUrl } from "../lib/assets";
import { useAuth } from "../store/auth";
import {
  ROLE_HOME,
  ROLE_LABEL,
} from "../store/session";
import "../styles/login.css";

/**
 * Login bersama untuk semua peran. Backend menentukan role akun dan halaman
 * mengarahkan pengguna ke dashboard yang sesuai setelah autentikasi berhasil.
 */

/** Username yang diingat saat "Ingat saya" dicentang. Password tidak disimpan. */
const REMEMBER_KEY = "simpos.ingatUsername";

export default function RoleLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [username, setUsername] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => localStorage.getItem(REMEMBER_KEY) !== null);
  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function cekCaps(e: KeyboardEvent<HTMLInputElement>) {
    setCapsOn(e.getModifierState("CapsLock"));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const user = await signIn(username.trim(), password);
      // "Ingat saya" hanya mengingat username agar tidak mengetik ulang.
      // Sesi tetap wajib login baru setelah browser ditutup.
      if (remember) localStorage.setItem(REMEMBER_KEY, username.trim());
      else localStorage.removeItem(REMEMBER_KEY);
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-bg auth">
      <div className="auth-card">
        <section className="auth-visual">
          <img src={assetUrl("assets/login-approved-visual.jpg")} alt="Koleksi kacamata Optik Mekar Jaya" />
          <div className="tint" />
          <div className="auth-copy">
            <h1>
              Solusi Penglihatan untuk Hidup yang <em>Lebih Baik</em>
            </h1>
            <p>
              Layanan optik modern dengan produk berkualitas dan pelayanan profesional untuk setiap gaya Anda.
            </p>
          </div>
          <div className="auth-tags" aria-hidden="true">
            <span>FRAME</span>
            <span>LENSA</span>
            <span>GAYA</span>
          </div>
        </section>

        <section className="auth-form">
          <div className="form-brand">
            <MRLogo size={46} />
            <b>Optik Mekar Jaya</b>
          </div>

          <h2>Selamat Datang</h2>
          <p className="sub">
            Silakan masuk untuk mengakses sistem Optik Mekar Jaya.
          </p>

          <form onSubmit={onSubmit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="login-username">Username</label>
              <div className="input-wrap">
                <User size={18} />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={cekCaps}
                  onKeyUp={cekCaps}
                  onBlur={() => setCapsOn(false)}
                />
                <button
                  type="button"
                  className="toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className={`caps-warn${capsOn ? " is-on" : ""}`}>
                <ArrowBigUp size={14} />
                Caps Lock aktif
              </span>
            </div>

            <div className="form-row">
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Ingat saya
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="auth-help">
            <b>Butuh bantuan masuk?</b>
            <span>Hubungi admin di cabang atau tim IT.</span>
            <span className="demo-foot">Gunakan username dan password yang terdaftar di sistem.</span>
          </div>

          <div className="brand-foot">v1.0 — © 2026 Optik Mekar Jaya</div>
        </section>
      </div>
    </div>
  );
}
