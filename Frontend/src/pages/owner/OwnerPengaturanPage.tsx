import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../store/auth";
import { useSharedStore, type Branch } from "../../store/sharedStore";
import { ApiError, ownerManagementApi } from "../../lib/api";
import { PageHeader, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";
import "../../styles/owner-settings.css";

type Tab = "profil" | "cabang" | "keamanan";

type BranchForm = {
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  pic: string;
  status: "Aktif" | "Nonaktif";
};

type CashierForm = {
  name: string;
  username: string;
  password: string;
  confirm: string;
};

type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
};

const EMPTY_CASHIER: CashierForm = { name: "", username: "", password: "", confirm: "" };
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

function nextBranchCode(branches: Branch[]): string {
  let highest = 0;
  for (const branch of branches) {
    const match = /^CB(\d+)$/i.exec(branch.code);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `CB${String(highest + 1).padStart(3, "0")}`;
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

function branchFormFrom(branch: Branch | "add", store: ReturnType<typeof useSharedStore>): BranchForm {
  if (branch === "add") {
    return { name: "", code: nextBranchCode(store.branches), city: "", address: "", phone: "", email: "", pic: "", status: "Aktif" };
  }

  const settings = store.settings;
  if (branch.type === "Pusat") {
    return {
      name: settings.storeName || branch.name,
      code: "PST",
      city: branch.city === "-" ? "" : branch.city,
      address: settings.storeAddress || (branch.address === "-" ? "" : branch.address),
      phone: settings.storePhone || (branch.phone === "-" ? "" : branch.phone),
      email: settings.storeEmail || branch.email || "",
      pic: settings.storePic || (branch.pic === "-" ? "" : branch.pic),
      status: "Aktif",
    };
  }

  return {
    name: branch.name,
    code: branch.code,
    city: branch.city === "-" ? "" : branch.city,
    address: branch.address === "-" ? "" : branch.address,
    phone: branch.phone === "-" ? "" : branch.phone,
    email: branch.email || "",
    pic: branch.pic === "-" ? "" : branch.pic,
    status: branch.status,
  };
}

export default function OwnerPengaturanPage() {
  const store = useSharedStore();
  const { session, user, refresh } = useAuth();

  const [tab, setTab] = useState<Tab>("profil");

  const owner = store.appUsers.find((candidate) => candidate.id === String(session?.id ?? "")) ?? null;
  const ownerName = owner?.name || user?.name || session?.name || "Pemilik";
  const ownerUsername = owner?.username || user?.username || session?.username || "";
  const ownerEmail = owner?.email || user?.email || "";
  const ownerPhone = owner?.phone || user?.phone || "";

  const [profile, setProfile] = useState({ name: ownerName, username: ownerUsername, email: ownerEmail, phone: ownerPhone });
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const profileTouched = useRef(false);
  const profileNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileTouched.current) return;
    setProfile({ name: ownerName, username: ownerUsername, email: ownerEmail, phone: ownerPhone });
  }, [ownerName, ownerUsername, ownerEmail, ownerPhone]);

  const [branchModal, setBranchModal] = useState<Branch | "add" | null>(null);
  const [branchForm, setBranchForm] = useState<BranchForm>(() => branchFormFrom("add", store));
  const [branchMsg, setBranchMsg] = useState("");
  const [branchError, setBranchError] = useState("");
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchNotice, setBranchNotice] = useState("");
  const [adminEnabled, setAdminEnabled] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [cashierOpen, setCashierOpen] = useState(false);
  const [cashierForm, setCashierForm] = useState<CashierForm>(EMPTY_CASHIER);
  const [cashierError, setCashierError] = useState("");
  const [cashierSaving, setCashierSaving] = useState(false);

  const [securityOpen, setSecurityOpen] = useState(false);
  const [securityForm, setSecurityForm] = useState<PasswordForm>(EMPTY_PASSWORD);
  const [securityError, setSecurityError] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const currentBranch = branchModal && branchModal !== "add" ? branchModal : null;
  const isPusat = currentBranch?.type === "Pusat";
  const branchList = store.branches.filter((branch) => branch.type === "Cabang");
  const central = store.branches.find((branch) => branch.type === "Pusat");
  const centralName = store.settings.storeName || central?.name || "Optik Mekar Jaya";
  const centralPic = store.settings.storePic || (central?.pic !== "-" ? central?.pic : ownerName) || ownerName;
  const centralPhone = store.settings.storePhone || (central?.phone !== "-" ? central?.phone : "") || "-";
  const centralEmail = store.settings.storeEmail || central?.email || "";
  const centralAddress = store.settings.storeAddress || (central?.address !== "-" ? central?.address : "") || "-";
  const branchCashiers = currentBranch?.type === "Cabang"
    ? store.appUsers.filter((candidate) => candidate.role === "kasir" && candidate.branchId === currentBranch.id)
    : [];
  const currentAdmin = currentBranch?.type === "Cabang"
    ? store.appUsers.find((candidate) => candidate.role === "admin" && candidate.branchId === currentBranch.id) ?? null
    : null;
  const strength = passwordStrength(securityForm.next);

  const editProfile = () => {
    setTab("profil");
    requestAnimationFrame(() => profileNameRef.current?.focus());
  };

  const openBranch = (target: Branch | "add") => {
    setBranchModal(target);
    setBranchForm(branchFormFrom(target, store));
    setBranchMsg("");
    setBranchError("");
    if (target === "add") {
      setAdminEnabled(false);
      setAdminUsername("");
      setAdminPassword("");
      return;
    }
    const admin = target.type === "Cabang"
      ? store.appUsers.find((candidate) => candidate.role === "admin" && candidate.branchId === target.id) ?? null
      : null;
    setAdminEnabled(Boolean(admin));
    setAdminUsername(admin?.username || admin?.email || "");
    setAdminPassword("");
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
      setProfileMsg("Profil berhasil diperbarui.");
    } catch (error) {
      setProfileError(errorMessage(error, "Profil gagal disimpan."));
    } finally {
      setProfileSaving(false);
    }
  };

  const submitBranch = async (event: FormEvent) => {
    event.preventDefault();
    if (!branchModal) return;
    setBranchSaving(true);
    setBranchError("");
    setBranchMsg("");

    if (branchModal !== "add" && branchModal.type === "Cabang" && adminEnabled) {
      if (adminUsername.trim() === "") {
        setBranchError("Username admin cabang wajib diisi.");
        setBranchSaving(false);
        return;
      }
      if (!currentAdmin && adminPassword.length < 8) {
        setBranchError("Kata sandi admin baru minimal 8 karakter.");
        setBranchSaving(false);
        return;
      }
      if (currentAdmin && adminPassword !== "" && adminPassword.length < 8) {
        setBranchError("Kata sandi admin minimal 8 karakter.");
        setBranchSaving(false);
        return;
      }
    }

    try {
      if (branchModal !== "add" && branchModal.type === "Pusat") {
        await ownerManagementApi.saveSettings({
          defaultMinimum: store.settings.defaultMinimum,
          storeName: branchForm.name.trim(),
          storePhone: branchForm.phone.trim(),
          storeAddress: branchForm.address.trim(),
          storeEmail: branchForm.email.trim(),
          storePic: branchForm.pic.trim(),
        });
      } else {
        await ownerManagementApi.saveBranch({
          ...(branchModal !== "add" ? { id: Number(branchModal.id) } : {}),
          name: branchForm.name.trim(),
          code: branchForm.code.trim().toUpperCase(),
          city: branchForm.city.trim(),
          address: branchForm.address.trim(),
          phone: branchForm.phone.trim(),
          email: branchForm.email.trim(),
          pic: branchForm.pic.trim(),
          status: branchForm.status,
        });

        if (branchModal !== "add" && branchModal.type === "Cabang" && adminEnabled) {
          await ownerManagementApi.saveUser({
            ...(currentAdmin ? { id: Number(currentAdmin.id) } : {}),
            name: branchForm.pic.trim(),
            username: adminUsername.trim(),
            password: adminPassword,
            role: "admin",
            branchId: Number(branchModal.id),
          });
        }
      }

      await store.refreshOwnerData();
      if (branchModal === "add") {
        setBranchNotice("Cabang baru berhasil ditambahkan.");
        setBranchModal(null);
      } else {
        setBranchMsg("Perubahan berhasil disimpan.");
        setAdminPassword("");
      }
    } catch (error) {
      setBranchError(errorMessage(error, "Data cabang gagal disimpan."));
    } finally {
      setBranchSaving(false);
    }
  };

  const openCashier = () => {
    setCashierForm(EMPTY_CASHIER);
    setCashierError("");
    setCashierOpen(true);
  };

  const submitCashier = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentBranch || currentBranch.type !== "Cabang") return;
    setCashierError("");
    if (cashierForm.password.length < 8) {
      setCashierError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (cashierForm.password !== cashierForm.confirm) {
      setCashierError("Konfirmasi kata sandi belum sama.");
      return;
    }
    setCashierSaving(true);
    try {
      await ownerManagementApi.saveUser({
        name: cashierForm.name.trim(),
        username: cashierForm.username.trim(),
        password: cashierForm.password,
        role: "kasir",
        branchId: Number(currentBranch.id),
      });
      await store.refreshOwnerData();
      setCashierOpen(false);
      setCashierForm(EMPTY_CASHIER);
      setBranchMsg("Akun kasir berhasil ditambahkan.");
    } catch (error) {
      setCashierError(errorMessage(error, "Akun kasir gagal disimpan."));
    } finally {
      setCashierSaving(false);
    }
  };

  const openSecurity = () => {
    setSecurityForm(EMPTY_PASSWORD);
    setSecurityError("");
    setShowPasswords(false);
    setSecurityOpen(true);
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
    <div className="page owner-settings">
      <PageHeader
        overline="PENGATURAN"
        title="Pengaturan"
        desc="Kelola profil Pemilik, informasi optik dan cabang, akun operasional, serta keamanan akses."
      />

      <section className="os-profile-card">
        <div className="os-avatar">{initialsFromName(ownerName)}</div>
        <div className="os-profile-copy">
          <span className="os-profile-role">
            <ShieldCheck size={14} />
            Pemilik (Super Admin)
          </span>
          <h2>{ownerName}</h2>
          <div className="os-profile-meta">
            <Mail size={15} />
            {ownerEmail || "Email belum diisi"}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={editProfile}>
          <Pencil size={15} />
          Edit Profil Saya
        </button>
      </section>

      <div className="os-tabs" role="tablist" aria-label="Pengaturan Pemilik">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "profil"}
          className={`os-tab ${tab === "profil" ? "is-active" : ""}`}
          onClick={() => setTab("profil")}
        >
          <UserRound size={16} />
          Profil Saya
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "cabang"}
          className={`os-tab ${tab === "cabang" ? "is-active" : ""}`}
          onClick={() => setTab("cabang")}
        >
          <Store size={16} />
          Informasi Optik &amp; Cabang
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "keamanan"}
          className={`os-tab ${tab === "keamanan" ? "is-active" : ""}`}
          onClick={() => setTab("keamanan")}
        >
          <Lock size={16} />
          Keamanan &amp; Akses
        </button>
      </div>

      {tab === "profil" ? (
        <div className="os-two-col">
          <section className="os-panel">
            <div className="os-panel-head">
              <div>
                <h3>Profil Akun Pemilik</h3>
                <p>Perbarui identitas yang digunakan untuk masuk dan menerima informasi penting.</p>
              </div>
            </div>
            <form onSubmit={submitProfile} className="os-form" noValidate>
              {profileError ? <div className="form-error" role="alert">{profileError}</div> : null}
              {profileMsg ? <div className="notice notice-ok" role="status">{profileMsg}</div> : null}
              <div className="os-form-grid">
                <label className="os-field">
                  <span>Nama Lengkap</span>
                  <input
                    ref={profileNameRef}
                    className="os-input"
                    value={profile.name}
                    onChange={(event) => {
                      profileTouched.current = true;
                      setProfile({ ...profile, name: event.target.value });
                    }}
                    placeholder="Nama lengkap Pemilik"
                  />
                </label>
                <label className="os-field">
                  <span>Username</span>
                  <input
                    className="os-input"
                    value={profile.username}
                    onChange={(event) => {
                      profileTouched.current = true;
                      setProfile({ ...profile, username: event.target.value });
                    }}
                    placeholder="Username untuk login"
                  />
                </label>
                <label className="os-field">
                  <span>Alamat Email</span>
                  <input
                    className="os-input"
                    type="email"
                    value={profile.email}
                    onChange={(event) => {
                      profileTouched.current = true;
                      setProfile({ ...profile, email: event.target.value });
                    }}
                    placeholder="nama@email.com"
                  />
                </label>
                <label className="os-field">
                  <span>Nomor Telepon / WhatsApp</span>
                  <input
                    className="os-input"
                    value={profile.phone}
                    onChange={(event) => {
                      profileTouched.current = true;
                      setProfile({ ...profile, phone: event.target.value });
                    }}
                    placeholder="08xx xxxx xxxx"
                  />
                </label>
              </div>
              <div className="os-form-actions">
                <span className="os-hint">Username dipakai untuk masuk ke SIMPOS.</span>
                <button className="btn btn-primary" type="submit" disabled={profileSaving || !owner}>
                  {profileSaving ? "Menyimpan..." : "Simpan Perubahan Profil"}
                </button>
              </div>
            </form>
          </section>

          <aside className="os-side-card">
            <div className="os-side-icon"><ShieldCheck size={22} /></div>
            <h3>Akses Pemilik</h3>
            <p>Akun Pemilik memiliki akses penuh ke seluruh cabang, laporan, dan pengaturan sistem.</p>
            <ul className="os-check-list">
              <li><CheckCircle2 size={16} /> Monitoring semua cabang</li>
              <li><CheckCircle2 size={16} /> Persetujuan pengajuan stok</li>
              <li><CheckCircle2 size={16} /> Pengaturan akun operasional</li>
            </ul>
          </aside>
        </div>
      ) : null}

      {tab === "cabang" ? (
        <section className="os-panel">
          <div className="os-panel-head">
            <div>
              <h3>Informasi Optik &amp; Cabang</h3>
              <p>Kelola kantor pusat, daftar cabang, serta akun admin dan kasir di setiap cabang.</p>
            </div>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => openBranch("add")}>
              <Plus size={15} />
              Tambah Cabang
            </button>
          </div>

          {branchNotice ? <div className="notice notice-ok" role="status">{branchNotice}</div> : null}

          <div className="os-central">
            <div className="os-central-icon"><Store size={24} /></div>
            <div className="os-central-copy">
              <span className="os-eyebrow">KANTOR PUSAT</span>
              <h4>{centralName}</h4>
              <div className="os-meta-row">
                <span><UserRound size={14} /> {centralPic}</span>
                <span><Phone size={14} /> {centralPhone}</span>
                {centralEmail ? <span><Mail size={14} /> {centralEmail}</span> : null}
              </div>
              <div className="os-meta-row">
                <span><MapPin size={14} /> {centralAddress}</span>
              </div>
            </div>
            <div className="os-central-actions">
              <StatusPill label="Aktif" />
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => central && openBranch(central)}
                disabled={!central}
              >
                Lihat Detail
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="os-list-head">
            <span>DAFTAR CABANG OPTIK TERDAFTAR</span>
            <span>{branchList.length} cabang</span>
          </div>

          <div className="os-branch-grid">
            {branchList.map((branch) => (
              <article className="os-branch-card" key={branch.id}>
                <div className="os-branch-top">
                  <div className="os-branch-icon"><Building2 size={20} /></div>
                  <StatusPill label={branch.status} />
                </div>
                <h4>{branch.name}</h4>
                <p className="os-branch-pic">{branch.pic}</p>
                <div className="os-meta-row">
                  <span><Phone size={14} /> {branch.phone || "-"}</span>
                  <span><MapPin size={14} /> {branch.city || branch.address}</span>
                </div>
                <button className="os-branch-link" type="button" onClick={() => openBranch(branch)}>
                  Lihat Detail
                  <ChevronRight size={15} />
                </button>
              </article>
            ))}
            {branchList.length === 0 ? (
              <div className="os-empty">Belum ada cabang terdaftar. Tambahkan cabang pertama Anda.</div>
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === "keamanan" ? (
        <section className="os-panel">
          <div className="os-panel-head">
            <div>
              <h3>Keamanan &amp; Akses</h3>
              <p>Jaga keamanan akun Pemilik dengan kata sandi yang kuat dan tidak digunakan di layanan lain.</p>
            </div>
          </div>

          {securityMsg ? <div className="notice notice-ok" role="status">{securityMsg}</div> : null}

          <div className="os-security-card">
            <div className="os-security-icon"><KeyRound size={22} /></div>
            <div className="os-security-copy">
              <h4>Kata Sandi Pemilik</h4>
              <p>Gunakan minimal 8 karakter dengan kombinasi huruf besar, angka, dan simbol.</p>
            </div>
            <button className="btn btn-ghost" type="button" onClick={openSecurity}>
              Ubah Sandi Saya
            </button>
          </div>

          <div className="os-security-note">
            <ShieldCheck size={18} />
            <span>Sesi aktif akan tetap berjalan setelah kata sandi diubah. Gunakan kata sandi baru saat masuk berikutnya.</span>
          </div>
        </section>
      ) : null}

      <div className="os-footer">© 2026 SIMPOS Optik Mekar Jaya · Hak Cipta Dilindungi Undang-Undang.</div>

      {branchModal ? (
        <div className="overlay" onClick={() => setBranchModal(null)}>
          <div className="os-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">{branchModal === "add" ? "CABANG BARU" : isPusat ? "KANTOR PUSAT" : "DETAIL CABANG"}</span>
                <h2>
                  {branchModal === "add"
                    ? "Tambah Cabang Baru"
                    : `Detail ${isPusat ? "Kantor Pusat" : "Cabang"}: ${branchForm.name || "-"}`}
                </h2>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={() => setBranchModal(null)} disabled={branchSaving}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitBranch} className="os-modal-body" noValidate>
              {branchError ? <div className="form-error" role="alert">{branchError}</div> : null}
              {branchMsg ? <div className="notice notice-ok" role="status">{branchMsg}</div> : null}

              <div className="os-form-grid">
                <label className="os-field">
                  <span>Nama Cabang</span>
                  <input
                    className="os-input"
                    value={branchForm.name}
                    onChange={(event) => setBranchForm({ ...branchForm, name: event.target.value })}
                    placeholder="cth. Optik Mekar Jaya — Padang"
                  />
                </label>
                <label className="os-field">
                  <span>Penanggung Jawab</span>
                  <input
                    className="os-input"
                    value={branchForm.pic}
                    onChange={(event) => setBranchForm({ ...branchForm, pic: event.target.value })}
                    placeholder="Nama penanggung jawab"
                  />
                </label>
                <label className="os-field">
                  <span>Kode Cabang</span>
                  <input
                    className="os-input"
                    value={branchForm.code}
                    onChange={(event) => setBranchForm({ ...branchForm, code: event.target.value.toUpperCase() })}
                    placeholder="CB001"
                    disabled={isPusat}
                  />
                </label>
                <label className="os-field">
                  <span>Status</span>
                  <select
                    className="os-input"
                    value={branchForm.status}
                    onChange={(event) => setBranchForm({ ...branchForm, status: event.target.value as "Aktif" | "Nonaktif" })}
                    disabled={isPusat}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </label>
                <label className="os-field">
                  <span>Nomor Telepon</span>
                  <input
                    className="os-input"
                    value={branchForm.phone}
                    onChange={(event) => setBranchForm({ ...branchForm, phone: event.target.value })}
                    placeholder="(0751) 123456"
                  />
                </label>
                <label className="os-field">
                  <span>Email Cabang</span>
                  <input
                    className="os-input"
                    type="email"
                    value={branchForm.email}
                    onChange={(event) => setBranchForm({ ...branchForm, email: event.target.value })}
                    placeholder="cabang@email.com"
                  />
                </label>
                <label className="os-field os-field-wide">
                  <span>Alamat Lengkap</span>
                  <textarea
                    className="os-input os-textarea"
                    value={branchForm.address}
                    onChange={(event) => setBranchForm({ ...branchForm, address: event.target.value })}
                    placeholder="Jalan, nomor, kota"
                    rows={3}
                  />
                </label>
                {!isPusat ? (
                  <label className="os-field">
                    <span>Kota</span>
                    <input
                      className="os-input"
                      value={branchForm.city}
                      onChange={(event) => setBranchForm({ ...branchForm, city: event.target.value })}
                      placeholder="Padang"
                    />
                  </label>
                ) : null}
              </div>

              {isPusat ? (
                <p className="os-hint">Informasi kantor pusat disimpan sebagai data toko dan langsung berlaku di seluruh aplikasi.</p>
              ) : null}

              {currentBranch?.type === "Cabang" ? (
                <>
                  <div className="os-account-box">
                    <div className="os-account-head">
                      <div>
                        <h4>Akun Admin Cabang</h4>
                        <p>{currentAdmin ? `Admin aktif: ${currentAdmin.name}` : "Belum ada akun admin untuk cabang ini."}</p>
                      </div>
                      <label className="os-switch">
                        <input
                          type="checkbox"
                          checked={adminEnabled}
                          onChange={(event) => setAdminEnabled(event.target.checked)}
                        />
                        <span />
                      </label>
                    </div>
                    {adminEnabled ? (
                      <div className="os-form-grid">
                        <label className="os-field">
                          <span>Username Admin</span>
                          <input
                            className="os-input"
                            value={adminUsername}
                            onChange={(event) => setAdminUsername(event.target.value)}
                            placeholder="username admin"
                          />
                        </label>
                        <label className="os-field">
                          <span>{currentAdmin ? "Kata Sandi Baru" : "Kata Sandi Admin"}</span>
                          <input
                            className="os-input"
                            type="password"
                            value={adminPassword}
                            onChange={(event) => setAdminPassword(event.target.value)}
                            placeholder={currentAdmin ? "Kosongkan jika tidak diubah" : "Min. 8 karakter"}
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>

                  <div className="os-account-box">
                    <div className="os-account-head">
                      <div>
                        <h4>Akun Kasir Cabang</h4>
                        <p>{branchCashiers.length} akun kasir terdaftar</p>
                      </div>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={openCashier}>
                        <Plus size={15} />
                        Tambah Kasir
                      </button>
                    </div>
                    {branchCashiers.length > 0 ? (
                      <div className="os-cashier-list">
                        {branchCashiers.map((cashier) => (
                          <div className="os-cashier-row" key={cashier.id}>
                            <div className="os-cashier-avatar">{initialsFromName(cashier.name)}</div>
                            <div>
                              <b>{cashier.name}</b>
                              <span>{cashier.username || cashier.email}</span>
                            </div>
                            <StatusPill label={cashier.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="os-empty">Belum ada akun kasir. Tambahkan akun agar cabang dapat melayani transaksi.</div>
                    )}
                  </div>
                </>
              ) : null}

              <div className="os-modal-actions">
                <button className="btn btn-ghost" type="button" onClick={() => setBranchModal(null)} disabled={branchSaving}>
                  Batal
                </button>
                <button className="btn btn-primary" type="submit" disabled={branchSaving}>
                  {branchSaving ? "Menyimpan..." : branchModal === "add" ? "Simpan Cabang" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {cashierOpen ? (
        <div className="overlay" onClick={() => setCashierOpen(false)}>
          <div className="os-modal os-modal-sm" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">AKUN KASIR</span>
                <h2>Tambah Kasir Cabang</h2>
                <p>{currentBranch?.name}</p>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={() => setCashierOpen(false)} disabled={cashierSaving}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitCashier} className="os-modal-body" noValidate>
              {cashierError ? <div className="form-error" role="alert">{cashierError}</div> : null}
              <label className="os-field">
                <span>Nama Lengkap</span>
                <input
                  className="os-input"
                  value={cashierForm.name}
                  onChange={(event) => setCashierForm({ ...cashierForm, name: event.target.value })}
                  placeholder="Nama kasir"
                />
              </label>
              <label className="os-field">
                <span>Username</span>
                <input
                  className="os-input"
                  value={cashierForm.username}
                  onChange={(event) => setCashierForm({ ...cashierForm, username: event.target.value })}
                  placeholder="username kasir"
                />
              </label>
              <div className="os-form-grid">
                <label className="os-field">
                  <span>Kata Sandi</span>
                  <input
                    className="os-input"
                    type="password"
                    value={cashierForm.password}
                    onChange={(event) => setCashierForm({ ...cashierForm, password: event.target.value })}
                    placeholder="Min. 8 karakter"
                  />
                </label>
                <label className="os-field">
                  <span>Konfirmasi Kata Sandi</span>
                  <input
                    className="os-input"
                    type="password"
                    value={cashierForm.confirm}
                    onChange={(event) => setCashierForm({ ...cashierForm, confirm: event.target.value })}
                    placeholder="Ulangi kata sandi"
                  />
                </label>
              </div>
              <div className="os-modal-actions">
                <button className="btn btn-ghost" type="button" onClick={() => setCashierOpen(false)} disabled={cashierSaving}>
                  Batal
                </button>
                <button className="btn btn-primary" type="submit" disabled={cashierSaving}>
                  {cashierSaving ? "Menyimpan..." : "Simpan Akun Kasir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {securityOpen ? (
        <div className="overlay" onClick={() => setSecurityOpen(false)}>
          <div className="os-modal os-modal-sm" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">KEAMANAN AKUN</span>
                <h2>Ubah Kata Sandi</h2>
                <p>Pastikan kata sandi baru kuat dan mudah Anda ingat.</p>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={() => setSecurityOpen(false)} disabled={securitySaving}>
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
                  />
                  <button className="os-eye" type="button" aria-label={showPasswords ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setShowPasswords((value) => !value)}>
                    {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="os-field">
                <span>Kata Sandi Baru</span>
                <input
                  className="os-input"
                  type={showPasswords ? "text" : "password"}
                  value={securityForm.next}
                  onChange={(event) => setSecurityForm({ ...securityForm, next: event.target.value })}
                  placeholder="Min. 8 karakter"
                />
                <div className="os-strength">
                  <div className="os-strength-track">
                    {[1, 2, 3, 4].map((step) => (
                      <span key={step} className={step <= strength.score ? "is-filled" : ""} />
                    ))}
                  </div>
                  <span>{strength.label}</span>
                </div>
              </label>
              <label className="os-field">
                <span>Konfirmasi Kata Sandi Baru</span>
                <input
                  className="os-input"
                  type={showPasswords ? "text" : "password"}
                  value={securityForm.confirm}
                  onChange={(event) => setSecurityForm({ ...securityForm, confirm: event.target.value })}
                  placeholder="Ulangi kata sandi baru"
                />
              </label>
              <div className="os-modal-actions">
                <button className="btn btn-ghost" type="button" onClick={() => setSecurityOpen(false)} disabled={securitySaving}>
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
