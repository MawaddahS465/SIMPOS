import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Power, Settings as SettingsIcon, X } from "lucide-react";
import { useSharedStore, type AppUser } from "../../store/sharedStore";
import { ApiError, ownerManagementApi } from "../../lib/api";
import { Avatar, Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type Tab = "pengguna" | "toko" | "preferensi";

const ROLE_LABEL: Record<AppUser["role"], string> = { kasir: "Kasir", admin: "Admin Cabang", pemilik: "Pemilik" };

export default function OwnerPengaturanPage() {
  const store = useSharedStore();
  const [tab, setTab] = useState<Tab>("pengguna");
  const [q, setQ] = useState("");

  // ---- form pengguna ----
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "kasir" as AppUser["role"], branchId: "" });
  const [formError, setFormError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmOn, setConfirmOn] = useState(false);

  // ---- form toko & preferensi ----
  const [toko, setToko] = useState({ ...store.settings });
  const [tokoMsg, setTokoMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = store.appUsers.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
  );

  const startAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "kasir", branchId: store.branches.find((branch) => branch.type === "Cabang")?.id ?? "" });
    setFormError("");
    setOpen(true);
  };

  const startEdit = (u: AppUser) => {
    setEditing(u.id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, branchId: u.branchId });
    setFormError("");
    setOpen(true);
  };

  const submitUser = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await ownerManagementApi.saveUser({
        ...(editing ? { id: Number(editing) } : {}),
        name: form.name,
        username: form.email,
        password: form.password,
        role: form.role,
        branchId: form.role === "pemilik" ? null : Number(form.branchId),
      });
      await store.refreshOwnerData();
      setOpen(false);
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : "Data pengguna gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const doStatus = async () => {
    if (!confirmId) return;
    setSaving(true);
    setFormError("");
    try {
      await ownerManagementApi.setUserStatus(Number(confirmId), confirmOn ? "aktif" : "nonaktif");
      await store.refreshOwnerData();
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : "Status pengguna gagal diperbarui.");
      return;
    } finally {
      setSaving(false);
    }
    setConfirmId(null);
  };

  const submitToko = async (e: FormEvent, prefOnly: boolean) => {
    e.preventDefault();
    setSaving(true);
    setTokoMsg("");
    try {
      await ownerManagementApi.saveSettings({
        defaultMinimum: Number(toko.defaultMinimum),
        storeName: toko.storeName,
        storePhone: toko.storePhone,
        storeAddress: toko.storeAddress,
      });
      await store.refreshOwnerData();
      setTokoMsg(prefOnly ? "Preferensi tersimpan dan langsung berlaku." : "Data toko tersimpan.");
    } catch (requestError) {
      setTokoMsg(requestError instanceof ApiError ? requestError.message : "Pengaturan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        overline="PENGATURAN"
        title="Pengaturan"
        desc="Kelola pengguna dan hak akses, data toko, serta preferensi operasional. Hanya Pemilik."
      />

      <div className="toolbar">
        <div className="toolbar-chips">
          <Chip active={tab === "pengguna"} onClick={() => setTab("pengguna")}>
            Pengguna
          </Chip>
          <Chip active={tab === "toko"} onClick={() => setTab("toko")}>
            Toko
          </Chip>
          <Chip active={tab === "preferensi"} onClick={() => setTab("preferensi")}>
            Preferensi
          </Chip>
        </div>
        {tab === "pengguna" ? (
          <div style={{ marginLeft: "auto" }}>
            <button className="btn btn-primary btn-sm" onClick={startAdd}>
              <Plus size={15} />
              Tambah Pengguna
            </button>
          </div>
        ) : null}
      </div>

      {tab === "pengguna" ? (
        <div className="toolbar">
          <SearchBox placeholder="Cari nama atau email pengguna..." value={q} onChange={setQ} />
        </div>
      ) : null}

      {tab === "pengguna" ? (
        <div className="table-wrap">
          <table className="tt">
            <thead>
              <tr>
                <th>NAMA / EMAIL</th>
                <th>ROLE</th>
                <th>CABANG</th>
                <th className="tt-center">STATUS</th>
                <th className="tt-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-person">
                      <Avatar initials={u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} size={40} />
                      <span>
                        <b>{u.name}</b>
                        <span>{u.email}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="tag-mini">{ROLE_LABEL[u.role]}</span>
                  </td>
                  <td>{u.role === "pemilik" ? "Seluruh Cabang" : store.branches.find((b) => b.id === u.branchId)?.name ?? u.branchId}</td>
                  <td className="tt-center">
                    <StatusPill label={u.status} />
                  </td>
                  <td className="tt-right">
                    <span className="row-actions">
                      <button className="link-action" onClick={() => startEdit(u)}>
                        <Pencil size={14} />
                        Ubah
                      </button>
                      {u.status === "Aktif" ? (
                        <button
                          className="link-action link-danger"
                          onClick={() => {
                            setConfirmId(u.id);
                            setConfirmOn(false);
                            setFormError("");
                          }}
                        >
                          <Power size={14} />
                          Nonaktifkan
                        </button>
                      ) : (
                        <button
                          className="link-action"
                          onClick={() => {
                            setConfirmId(u.id);
                            setConfirmOn(true);
                            setFormError("");
                          }}
                        >
                          <Check size={14} />
                          Aktifkan
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-note">Pengguna tidak ditemukan.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-foot">
            <span className="foot-note">
              {rows.length} pengguna · akun baru langsung dapat digunakan sesuai perannya.
            </span>
          </div>
        </div>
      ) : null}

      {tab === "toko" ? (
        <section className="co-card" style={{ maxWidth: 640 }}>
          <div className="section-head">
            <h2>Data Toko</h2>
          </div>
          <form
            onSubmit={(e) => submitToko(e, false)}
            className="drawer-form"
            noValidate
          >
            {tokoMsg ? (
              <div className={tokoMsg.includes("tersimpan") ? "notice notice-ok" : "form-error"} role="status">
                {tokoMsg}
              </div>
            ) : null}
            <label className="afield">
              <span>Nama toko/cabang</span>
              <input value={toko.storeName} onChange={(e) => setToko({ ...toko, storeName: e.target.value })} />
            </label>
            <label className="afield">
              <span>Telepon</span>
              <input value={toko.storePhone} onChange={(e) => setToko({ ...toko, storePhone: e.target.value })} />
            </label>
            <label className="afield">
              <span>Alamat</span>
              <input value={toko.storeAddress} onChange={(e) => setToko({ ...toko, storeAddress: e.target.value })} />
            </label>
            <div className="drawer-foot" style={{ justifyContent: "flex-start" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Data Toko"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === "preferensi" ? (
        <section className="co-card" style={{ maxWidth: 640 }}>
          <div className="section-head">
            <div>
              <h2>Preferensi Operasional</h2>
              <div className="section-desc">Berlaku langsung setelah disimpan</div>
            </div>
          </div>
          <form onSubmit={(e) => submitToko(e, true)} className="drawer-form" noValidate>
            {tokoMsg ? (
              <div className={tokoMsg.includes("tersimpan") ? "notice notice-ok" : "form-error"} role="status">
                {tokoMsg}
              </div>
            ) : null}
            <label className="afield">
              <span>Batas minimum default produk baru (unit)</span>
              <input
                inputMode="numeric"
                value={String(toko.defaultMinimum)}
                onChange={(e) => setToko({ ...toko, defaultMinimum: Number(e.target.value.replace(/[^0-9]/g, "")) })}
              />
            </label>
            <div className="drawer-foot" style={{ justifyContent: "flex-start" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Preferensi"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{editing ? "Ubah Pengguna" : "Tambah Pengguna"}</h2>
                <div className="section-desc">Akun pengguna dan akses sesuai peran.</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)} disabled={saving}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitUser} className="drawer-form" noValidate>
              {formError ? (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              ) : null}
              <label className="afield">
                <span>Nama lengkap</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth. Siti Rahma" />
              </label>
              <label className="afield">
                <span>Email (dipakai login)</span>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" />
              </label>
              <label className="afield">
                <span>Password {editing ? "(kosongkan bila tidak diubah)" : "(min. 8 karakter)"}</span>
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
              </label>
              <label className="afield">
                <span>Role &amp; hak akses</span>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppUser["role"] })}>
                  <option value="kasir">Kasir — Cabang Padang</option>
                  <option value="admin">Admin Cabang — Cabang Padang</option>
                  <option value="pemilik">Pemilik — Seluruh Cabang</option>
                </select>
              </label>
              {form.role !== "pemilik" ? (
                <label className="afield">
                  <span>Cabang penempatan</span>
                  <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                    <option value="">Pilih cabang</option>
                    {store.branches.filter((branch) => branch.type === "Cabang" && branch.status === "Aktif").map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmId ? (
        <div className="overlay" onClick={() => setConfirmId(null)}>
          <div className="confirm" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <h2>{confirmOn ? "Aktifkan pengguna?" : "Nonaktifkan pengguna?"}</h2>
            <p>
              {confirmOn
                ? "Pengguna dapat login kembali sesuai role-nya."
                : "Pengguna tidak dapat login sampai diaktifkan lagi. Riwayatnya tetap tersimpan."}
            </p>
            {formError ? (
              <div className="form-error" role="alert">
                {formError}
              </div>
            ) : null}
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>
                Batal
              </button>
              <button className={confirmOn ? "btn btn-primary" : "btn btn-danger"} onClick={doStatus}>
                {confirmOn ? "Aktifkan" : "Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <span className="foot-note" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <SettingsIcon size={14} />
        Perubahan tersimpan otomatis.
      </span>
    </div>
  );
}
