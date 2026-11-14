import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AtSign,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../store/auth";
import { useSharedStore } from "../../store/sharedStore";
import { ApiError, ownerManagementApi } from "../../lib/api";
import "../../styles/pages.css";
import "../../styles/admin.css";
import "../../styles/owner-settings.css";

type ProfileForm = {
  name: string;
  username: string;
  email: string;
  phone: string;
};

type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
};

const EMPTY_PASSWORD: PasswordForm = { current: "", next: "", confirm: "" };

function initialsFromName(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

function passwordStrength(value: string): { score: number; label: string } {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const labels = ["Lemah", "Cukup", "Sedang", "Kuat", "Sangat Kuat"];
  return { score, label: labels[score] };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function OwnerPengaturanPage() {
  const store = useSharedStore();
  const { session, user, refresh } = useAuth();

  const owner = store.appUsers.find((candidate) => candidate.id === String(session?.id ?? "")) ?? null;
  const ownerName = owner?.name || user?.name || session?.name || "Pemilik";
  const ownerUsername = owner?.username || user?.username || session?.username || "";
  const ownerEmail = owner?.email || user?.email || "";
  const ownerPhone = owner?.phone || user?.phone || "";
  const storeName = store.settings.storeName || "Optik Mekar Jaya";

  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>({
    name: ownerName,
    username: ownerUsername,
    email: ownerEmail,
    phone: ownerPhone,
  });
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const profileTouched = useRef(false);

  const [securityOpen, setSecurityOpen] = useState(false);
  const [securityForm, setSecurityForm] = useState<PasswordForm>(EMPTY_PASSWORD);
  const [securityError, setSecurityError] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const strength = passwordStrength(securityForm.next);

  useEffect(() => {
    if (profileTouched.current) return;
    setProfile({ name: ownerName, username: ownerUsername, email: ownerEmail, phone: ownerPhone });
  }, [ownerName, ownerUsername, ownerEmail, ownerPhone]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (securityOpen && !securitySaving) {
        setSecurityOpen(false);
        return;
      }
      if (profileOpen && !profileSaving) {
        setProfileOpen(false);
        setProfileError("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [profileOpen, profileSaving, securityOpen, securitySaving]);

  const updateProfile = (field: keyof ProfileForm, value: string) => {
    profileTouched.current = true;
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const editProfile = () => {
    setProfile({ name: ownerName, username: ownerUsername, email: ownerEmail, phone: ownerPhone });
    setProfileError("");
    setProfileMsg("");
    profileTouched.current = false;
    setProfileOpen(true);
  };

  const closeProfile = () => {
    if (profileSaving) return;
    setProfileOpen(false);
    setProfileError("");
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!owner) {
      setProfileError("Data profil belum dimuat. Coba muat ulang halaman.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileMsg("");
    try {
      await ownerManagementApi.saveUser({
        id: Number(owner.id),
        name: profile.name.trim(),
        username: profile.username.trim(),
        password: "",
        role: "pemilik",
        branchId: null,
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      });
      await store.refreshOwnerData();
      await refresh();
      profileTouched.current = false;
      setProfileOpen(false);
      setProfileMsg("Profil berhasil diperbarui.");
    } catch (error) {
      setProfileError(errorMessage(error, "Profil gagal disimpan."));
    } finally {
      setProfileSaving(false);
    }
  };

  const openSecurity = () => {
    setSecurityForm(EMPTY_PASSWORD);
    setSecurityError("");
    setSecurityMsg("");
    setShowPasswords(false);
    setSecurityOpen(true);
  };

  const closeSecurity = () => {
    if (securitySaving) return;
    setSecurityOpen(false);
    setSecurityError("");
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setSecurityError("");
    if (securityForm.next.length < 8) {
      setSecurityError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (securityForm.next !== securityForm.confirm) {
      setSecurityError("Konfirmasi kata sandi baru belum sama.");
      return;
    }

    setSecuritySaving(true);
    try {
      await ownerManagementApi.changePassword(securityForm.current, securityForm.next);
      setSecurityOpen(false);
      setSecurityForm(EMPTY_PASSWORD);
      setSecurityMsg("Kata sandi berhasil diperbarui.");
    } catch (error) {
      setSecurityError(errorMessage(error, "Kata sandi gagal diperbarui."));
    } finally {
      setSecuritySaving(false);
    }
  };

  return (
    <div className="os-settings-page">
      <section className="os-settings-card">
        <div className="os-settings-head">
          <div className="os-settings-avatar" aria-hidden="true">{initialsFromName(ownerName)}</div>
          <div className="os-settings-title">
            <h1>{ownerName}</h1>
            <p>Pemilik Utama SIMPOS {storeName}</p>
          </div>
          <button className="os-settings-edit" type="button" onClick={editProfile}>
            <Pencil size={15} />
            Edit Profil
          </button>
        </div>

        <div className="os-settings-grid">
          <div className="os-settings-tile">
            <span className="os-settings-icon is-name"><UserRound size={17} /></span>
            <div className="os-settings-tile-copy">
              <span className="os-settings-label">Nama Lengkap</span>
              <b className="os-settings-value">{ownerName}</b>
            </div>
          </div>
          <div className="os-settings-tile">
            <span className="os-settings-icon is-username"><AtSign size={17} /></span>
            <div className="os-settings-tile-copy">
              <span className="os-settings-label">Username</span>
              <b className="os-settings-value">{ownerUsername || "Belum diisi"}</b>
            </div>
          </div>
          <div className="os-settings-tile">
            <span className="os-settings-icon is-email"><Mail size={17} /></span>
            <div className="os-settings-tile-copy">
              <span className="os-settings-label">Alamat Email</span>
              <b className="os-settings-value">{ownerEmail || "Belum diisi"}</b>
            </div>
          </div>
          <div className="os-settings-tile">
            <span className="os-settings-icon is-phone"><Phone size={17} /></span>
            <div className="os-settings-tile-copy">
              <span className="os-settings-label">Nomor Telepon / WhatsApp</span>
              <b className="os-settings-value">{ownerPhone || "Belum diisi"}</b>
            </div>
          </div>
        </div>

        <div className="os-settings-security">
          <span className="os-settings-security-icon"><ShieldCheck size={20} /></span>
          <div className="os-settings-security-copy">
            <h2>Keamanan &amp; Kata Sandi</h2>
            <p>Amankan akun Anda dengan mengganti kata sandi secara berkala.</p>
          </div>
          <button className="os-settings-security-btn" type="button" onClick={openSecurity}>
            <KeyRound size={15} />
            Ubah Kata Sandi
          </button>
        </div>

        {profileMsg ? <div className="os-settings-notice" role="status">{profileMsg}</div> : null}
        {securityMsg ? <div className="os-settings-notice" role="status">{securityMsg}</div> : null}
      </section>

      <p className="os-settings-footer">© 2026 SIMPOS {storeName} · Hak Cipta Dilindungi Undang-Undang.</p>

      {profileOpen ? (
        <div className="overlay" onClick={closeProfile}>
          <div
            className="os-modal os-modal-sm os-settings-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">EDIT PROFIL PEMILIK</span>
                <h2 id="edit-profile-title">Edit Profil Pemilik</h2>
                <p>Perbarui informasi identitas pribadi akun Anda.</p>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={closeProfile} disabled={profileSaving}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitProfile} className="os-modal-body" noValidate>
              {profileError ? <div className="form-error" role="alert">{profileError}</div> : null}
              <div className="os-settings-form-stack">
                <label className="os-field">
                  <span>Nama Lengkap</span>
                  <input
                    className="os-input"
                    value={profile.name}
                    onChange={(event) => updateProfile("name", event.target.value)}
                    placeholder="Nama lengkap pemilik"
                    autoComplete="name"
                    autoFocus
                  />
                </label>
                <label className="os-field">
                  <span>Username</span>
                  <input
                    className="os-input"
                    value={profile.username}
                    onChange={(event) => updateProfile("username", event.target.value)}
                    placeholder="Username untuk login"
                    autoComplete="username"
                  />
                </label>
                <label className="os-field">
                  <span>Alamat Email</span>
                  <input
                    className="os-input"
                    type="email"
                    value={profile.email}
                    onChange={(event) => updateProfile("email", event.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                  />
                </label>
                <label className="os-field">
                  <span>Nomor Telepon / WhatsApp</span>
                  <input
                    className="os-input"
                    type="tel"
                    value={profile.phone}
                    onChange={(event) => updateProfile("phone", event.target.value)}
                    placeholder="08xx xxxx xxxx"
                    autoComplete="tel"
                  />
                </label>
              </div>
              <div className="os-modal-actions">
                <button className="btn btn-ghost" type="button" onClick={closeProfile} disabled={profileSaving}>
                  Batal
                </button>
                <button className="btn btn-primary" type="submit" disabled={profileSaving || !owner}>
                  {profileSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {securityOpen ? (
        <div className="overlay" onClick={closeSecurity}>
          <div
            className="os-modal os-modal-sm os-settings-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">KEAMANAN AKUN</span>
                <h2 id="change-password-title">Ubah Kata Sandi</h2>
                <p>Pastikan kata sandi baru kuat dan mudah Anda ingat.</p>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={closeSecurity} disabled={securitySaving}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitPassword} className="os-modal-body" noValidate>
              {securityError ? <div className="form-error" role="alert">{securityError}</div> : null}
              <label className="os-field">
                <span>Kata Sandi Saat Ini</span>
                <div className="os-input-wrap">
                  <input
                    className="os-input"
                    type={showPasswords ? "text" : "password"}
                    value={securityForm.current}
                    onChange={(event) => setSecurityForm({ ...securityForm, current: event.target.value })}
                    placeholder="Masukkan kata sandi saat ini"
                    autoComplete="current-password"
                    autoFocus
                  />
                  <button
                    className="os-eye"
                    type="button"
                    aria-label={showPasswords ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={showPasswords}
                    onClick={() => setShowPasswords((value) => !value)}
                  >
                    {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="os-field">
                <span>Kata Sandi Baru</span>
                <div className="os-input-wrap">
                  <input
                    className="os-input"
                    type={showPasswords ? "text" : "password"}
                    value={securityForm.next}
                    onChange={(event) => setSecurityForm({ ...securityForm, next: event.target.value })}
                    placeholder="Min. 8 karakter"
                    autoComplete="new-password"
                  />
                  <button
                    className="os-eye"
                    type="button"
                    aria-label={showPasswords ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={showPasswords}
                    onClick={() => setShowPasswords((value) => !value)}
                  >
                    {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
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
                    type={showPasswords ? "text" : "password"}
                    value={securityForm.confirm}
                    onChange={(event) => setSecurityForm({ ...securityForm, confirm: event.target.value })}
                    placeholder="Ulangi kata sandi baru"
                    autoComplete="new-password"
                  />
                  <button
                    className="os-eye"
                    type="button"
                    aria-label={showPasswords ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={showPasswords}
                    onClick={() => setShowPasswords((value) => !value)}
                  >
                    {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <div className="os-modal-actions">
                <button className="btn btn-ghost" type="button" onClick={closeSecurity} disabled={securitySaving}>
                  Batal
                </button>
                <button className="btn btn-primary" type="submit" disabled={securitySaving}>
                  {securitySaving ? "Menyimpan..." : "Simpan Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
