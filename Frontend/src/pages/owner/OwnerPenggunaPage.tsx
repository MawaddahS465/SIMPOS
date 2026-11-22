import { useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, Pencil, Plus, UserRound, X } from "lucide-react";
import { ApiError, ownerManagementApi } from "../../lib/api";
import { useAuth } from "../../store/auth";
import { useSharedStore, type AppUser } from "../../store/sharedStore";
import { PageHeader, SearchBox, StatCard, StatusPill, TableCols } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";
import "../../styles/owner-settings.css";

type Role = AppUser["role"];
type StatusFilter = "all" | "aktif" | "nonaktif";

type UserForm = {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: Role;
  branchId: string;
  password: string;
  status: "aktif" | "nonaktif";
};

const emptyForm = (): UserForm => ({
  name: "",
  username: "",
  email: "",
  phone: "",
  role: "admin",
  branchId: "",
  password: "",
  status: "aktif",
});

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

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

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function roleLabel(role: Role, branchType?: string): string {
  if (role === "pemilik") return "Pemilik";
  if (role === "admin") return branchType === "Pusat" ? "Admin Gudang" : "Admin Cabang";
  return branchType === "Pusat" ? "Kasir Gudang" : "Kasir Cabang";
}

export default function OwnerPenggunaPage() {
  const store = useSharedStore();
  const { session } = useAuth();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);

  const selfId = String(session?.id ?? "");

  const branchesById = useMemo(() => {
    const map = new Map<string, { name: string; type: string }>();
    store.branches.forEach((branch) => {
      map.set(String(branch.dbId ?? branch.id), {
        name: branch.type === "Pusat" ? "Gudang Pusat" : branch.name,
        type: branch.type,
      });
    });
    return map;
  }, [store.branches]);

  const branchSelectOptions = useMemo(
    () =>
      store.branches.map((branch) => ({
        value: String(branch.dbId ?? branch.id),
        label: branch.type === "Pusat" ? "Gudang Pusat" : branch.name,
      })),
    [store.branches],
  );

  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase();
    return store.appUsers.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (branchFilter !== "all" && user.branchId !== branchFilter) return false;
      if (statusFilter === "aktif" && user.status !== "Aktif") return false;
      if (statusFilter === "nonaktif" && user.status !== "Nonaktif") return false;
      if (!key) return true;
      return `${user.name} ${user.username ?? ""} ${user.email} ${user.phone ?? ""}`
        .toLowerCase()
        .includes(key);
    });
  }, [branchFilter, query, roleFilter, statusFilter, store.appUsers]);

  const total = store.appUsers.length;
  const adminCount = store.appUsers.filter((user) => user.role === "admin").length;
  const kasirCount = store.appUsers.filter((user) => user.role === "kasir").length;
  const inactiveCount = store.appUsers.filter((user) => user.status === "Nonaktif").length;
  const showLoading = total === 0 && (store.ownerDataStatus === "idle" || store.ownerDataStatus === "loading");

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm(), branchId: branchSelectOptions[0]?.value ?? "" });
    setFormError("");
    setShowFormPassword(false);
    setModalOpen(true);
  }

  function openEdit(user: AppUser) {
    setEditing(user);
    setForm({
      name: user.name,
      username: user.username ?? "",
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      branchId: user.branchId === "all" ? "" : user.branchId,
      password: "",
      status: user.status === "Aktif" ? "aktif" : "nonaktif",
    });
    setFormError("");
    setShowFormPassword(false);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setFormError("");
  }

  function updateForm<K extends keyof UserForm>(field: K, value: UserForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(): string {
    const name = form.name.trim();
    const username = form.username.trim();
    const email = form.email.trim();
    const isSelf = editing !== null && editing.id === selfId;

    if (name.length < 2) return "Nama lengkap minimal 2 karakter.";
    if (username.length < 2) return "Username minimal 2 karakter.";
    if (email && !isEmail(email)) return "Format email tidak valid.";
    if (form.role !== "pemilik" && !form.branchId) return "Pilih cabang untuk akun Admin atau Kasir.";
    if (!isSelf) {
      if (editing === null && form.password.length < 8) return "Password awal minimal 8 karakter.";
      if (editing !== null && form.password !== "" && form.password.length < 8) {
        return "Password baru minimal 8 karakter, atau kosongkan jika tidak diubah.";
      }
    }
    return "";
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setFormError(validation);
      return;
    }

    const isSelf = editing !== null && editing.id === selfId;
    const branchId = form.role === "pemilik" ? null : Number(form.branchId);
    if (form.role !== "pemilik" && !Number.isFinite(branchId)) {
      setFormError("Cabang tidak valid.");
      return;
    }

    setSaving(true);
    setFormError("");
    setActionError("");
    setNotice("");
    try {
      const result = await ownerManagementApi.saveUser({
        ...(editing ? { id: Number(editing.id) } : {}),
        name: form.name.trim(),
        username: form.username.trim(),
        password: isSelf ? "" : form.password,
        role: form.role,
        branchId,
        email: form.email.trim(),
        phone: form.phone.trim(),
      });

      if (editing === null && form.status === "nonaktif") {
        await ownerManagementApi.setUserStatus(result.id, "nonaktif");
      }

      await store.refreshOwnerData();
      setModalOpen(false);
      setNotice(
        editing
          ? `Akun ${form.name.trim()} diperbarui.`
          : `Akun ${form.name.trim()} (${roleLabel(form.role)}) dibuat.`,
      );
    } catch (error) {
      setFormError(errorMessage(error, "Data pengguna gagal disimpan."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: AppUser) {
    const nextStatus = user.status === "Aktif" ? "nonaktif" : "aktif";
    if (
      nextStatus === "nonaktif" &&
      !window.confirm(`Nonaktifkan akun ${user.name}? Akun tidak bisa login sampai diaktifkan kembali.`)
    ) {
      return;
    }

    setBusyId(user.id);
    setActionError("");
    setNotice("");
    try {
      await ownerManagementApi.setUserStatus(Number(user.id), nextStatus);
      await store.refreshOwnerData();
      setNotice(
        nextStatus === "nonaktif" ? `Akun ${user.name} dinonaktifkan.` : `Akun ${user.name} diaktifkan.`,
      );
    } catch (error) {
      setActionError(errorMessage(error, "Status akun gagal diperbarui."));
    } finally {
      setBusyId(null);
    }
  }

  const editingSelf = editing !== null && editing.id === selfId;

  return (
    <div className="page">
      <PageHeader
        title="Manajemen Pengguna"
        actions={
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            <Plus size={16} />
            Tambah Pengguna
          </button>
        }
      />

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <StatCard label="Total Akun" value={String(total)} caption="Seluruh role" icon={<UserRound size={22} />} tone="violet" />
        <StatCard label="Admin" value={String(adminCount)} caption="Admin cabang & gudang" icon={<UserRound size={22} />} tone="blue" />
        <StatCard label="Kasir" value={String(kasirCount)} caption="Kasir cabang" icon={<UserRound size={22} />} tone="green" />
        <StatCard label="Nonaktif" value={String(inactiveCount)} caption="Tidak dapat login" icon={<UserRound size={22} />} tone="amber" />
      </div>

      {notice ? <div className="notice notice-ok" role="status">{notice}</div> : null}
      {actionError ? <div className="notice" role="alert">{actionError}</div> : null}

      <div className="toolbar">
        <SearchBox placeholder="" value={query} onChange={setQuery} />
        <div className="toolbar-chips">
          <select className="chip-select" aria-label="Filter Peran" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | Role)}>
            <option value="all">Semua Peran</option>
            <option value="admin">Admin</option>
            <option value="kasir">Kasir</option>
            <option value="pemilik">Pemilik</option>
          </select>
          <select className="chip-select" aria-label="Filter Cabang" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
            <option value="all">Semua Cabang</option>
            {branchSelectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="chip-select" aria-label="Filter Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tt owner-table owner-table-dense">
          <TableCols widths={["24%", "14%", "18%", "20%", "10%", "14%"]} />
          <thead><tr><th>NAMA / USERNAME</th><th>PERAN</th><th>CABANG</th><th>KONTAK</th><th className="tt-center">STATUS</th><th className="tt-right">AKSI</th></tr></thead>
          <tbody>
            {showLoading ? <tr><td colSpan={6}><div className="empty-note">Memuat pengguna...</div></td></tr> : null}
            {!showLoading ? filtered.map((user) => {
              const isSelf = user.id === selfId;
              const branch = branchesById.get(user.branchId);
              return (
                <tr key={user.id}>
                  <td>
                    <div className="tt-num">{user.name}{isSelf ? " (Anda)" : ""}</div>
                    <div className="tt-sub">{user.username ? `@${user.username.replace(/^@/, "")}` : "-"}</div>
                  </td>
                  <td>{roleLabel(user.role, branch?.type)}</td>
                  <td>{user.role === "pemilik" ? "Semua Cabang" : branch?.name ?? "-"}</td>
                  <td>
                    <div className="tt-num">{user.email || "-"}</div>
                    <div className="tt-sub">{user.phone || "-"}</div>
                  </td>
                  <td className="tt-center"><StatusPill label={user.status} /></td>
                  <td className="tt-right">
                    <div className="owner-row-actions">
                      <button className="link-action" type="button" onClick={() => openEdit(user)}>
                        <Pencil size={14} /> Edit
                      </button>
                      {isSelf ? null : (
                        <button
                          className="link-action"
                          type="button"
                          onClick={() => void toggleStatus(user)}
                          disabled={busyId === user.id}
                        >
                          {busyId === user.id ? "Menyimpan..." : user.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : null}
            {!showLoading && filtered.length === 0 ? <tr><td colSpan={6}><div className="empty-note">Tidak ada pengguna yang cocok.</div></td></tr> : null}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div className="overlay" onClick={closeModal}>
          <div
            className="os-modal"
            style={{ maxWidth: 640 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
          >
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">{editing ? "UBAH AKUN" : "AKUN BARU"}</span>
                <h2 id="user-modal-title">{editing ? `Edit Pengguna: ${editing.name}` : "Tambah Pengguna"}</h2>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={closeModal} disabled={saving}>
                <X size={18} />
              </button>
            </div>
            <form className="os-modal-body" onSubmit={submit} noValidate>
              {formError ? <div className="form-error" role="alert">{formError}</div> : null}
              <div className="os-form-grid">
                <label className="os-field">
                  <span>Nama Lengkap *</span>
                  <input className="os-input" value={form.name} onChange={(event) => updateForm("name", event.target.value)} autoComplete="name" autoFocus />
                </label>
                <label className="os-field">
                  <span>Username *</span>
                  <input className="os-input" value={form.username} onChange={(event) => updateForm("username", event.target.value)} autoComplete="username" />
                </label>
                <label className="os-field">
                  <span>Email</span>
                  <input className="os-input" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} autoComplete="email" />
                </label>
                <label className="os-field">
                  <span>Nomor HP / WhatsApp</span>
                  <input className="os-input" type="tel" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} autoComplete="tel" />
                </label>
                <label className="os-field">
                  <span>Peran *</span>
                  <select
                    className="os-input"
                    value={form.role}
                    onChange={(event) => updateForm("role", event.target.value as Role)}
                    disabled={editingSelf}
                  >
                    <option value="admin">Admin</option>
                    <option value="kasir">Kasir</option>
                    <option value="pemilik">Pemilik</option>
                  </select>
                  {editingSelf ? <small className="os-password-help">Role akun sendiri tidak dapat diubah.</small> : null}
                </label>
                <label className="os-field">
                  <span>Cabang {form.role === "pemilik" ? "" : "*"}</span>
                  <select
                    className="os-input"
                    value={form.role === "pemilik" ? "" : form.branchId}
                    onChange={(event) => updateForm("branchId", event.target.value)}
                    disabled={form.role === "pemilik"}
                  >
                    <option value="">{form.role === "pemilik" ? "Semua Cabang" : "Pilih cabang"}</option>
                    {branchSelectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {!editingSelf ? (
                  <label className="os-field os-field-wide">
                    <span>{editing ? "Password Baru (opsional)" : "Password Awal *"}</span>
                    <span className="os-input-wrap">
                      <input
                        className="os-input"
                        type={showFormPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) => updateForm("password", event.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        className="os-eye"
                        type="button"
                        aria-label={showFormPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        onClick={() => setShowFormPassword((value) => !value)}
                      >
                        {showFormPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                    <small className="os-password-help">
                      {editing ? "Kosongkan jika tidak ingin mengganti kata sandi." : "Minimal 8 karakter."}
                    </small>
                  </label>
                ) : (
                  <div className="os-field os-field-wide">
                    <span>Password</span>
                    <small className="os-password-help">Ganti kata sandi akun Anda lewat menu profil di kanan atas.</small>
                  </div>
                )}
                {!editing ? (
                  <label className="os-field">
                    <span>Status Akun</span>
                    <select className="os-input" value={form.status} onChange={(event) => updateForm("status", event.target.value as UserForm["status"])}>
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </label>
                ) : null}
              </div>
              <div className="os-modal-actions">
                <button className="btn btn-ghost" type="button" onClick={closeModal} disabled={saving}>Batal</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
}
