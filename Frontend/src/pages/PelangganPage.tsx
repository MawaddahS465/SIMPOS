import { useEffect, useState, type FormEvent } from "react";
import { Glasses, MessageSquare, Pencil, UserPlus, Users, X } from "lucide-react";
import { type Customer } from "../data/customers";
import { ApiError, kasirApi, type ApiCustomer } from "../lib/api";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import "../styles/pages.css";
import "../styles/admin.css";

type FormState = { name: string; phone: string; address: string };

const EMPTY: FormState = { name: "", phone: "", address: "" };

export default function PelangganPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Resep" | "PO">("Semua");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    try {
      const rows = await kasirApi.customers();
      setCustomers(rows.map((row: ApiCustomer): Customer => ({
        id: String(row.id_pelanggan),
        code: `PLG-${String(row.id_pelanggan).padStart(4, "0")}`,
        name: row.nama_pelanggan,
        initials: row.nama_pelanggan.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(),
        phone: row.no_hp ?? "-",
        email: "",
        address: row.alamat ?? "",
        hasResep: Number(row.jml_resep ?? 0) > 0,
        poActive: Number(row.po_aktif ?? 0),
        branch: "Cabang",
      })));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Pelanggan gagal dimuat dari database.");
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  const poCountOf = (customer: Customer) => customer.poActive;

  const hasResepOf = (c: Customer) => c.hasResep;

  const rows = customers
    .filter((c) => {
      if (filter === "Resep" && !hasResepOf(c)) return false;
      if (filter === "PO" && poCountOf(c) === 0) return false;
      return `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase());
    });

  const withResep = customers.filter((c) => hasResepOf(c)).length;
  const withPo = customers.filter((c) => poCountOf(c) > 0).length;

  const editingCustomer = editing ? customers.find((c) => c.id === editing) : null;
  const previewCode = editingCustomer?.code ?? "Dibuat otomatis";

  function startAdd() {
    setEditing(null);
    setForm(EMPTY);
    setFormError("");
    setOpen(true);
  }

  function startEdit(c: Customer) {
    setEditing(c.id);
    setForm({ name: c.name, phone: c.phone, address: c.address ?? "" });
    setFormError("");
    setOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = form;
      if (editing) await kasirApi.updateCustomer(Number(editing), payload);
      else await kasirApi.createCustomer(payload);
      await loadCustomers();
      setOpen(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Pelanggan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        overline="PENGELOLAAN PELANGGAN"
        title="Data Pelanggan"
        desc="Cari pelanggan berdasarkan nama atau nomor HP, kelola data pelanggan, dan catat riwayat resep."
        actions={
          <button className="btn btn-primary" onClick={startAdd}>
            <UserPlus size={16} />
            Tambah Pelanggan
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Total pelanggan" value={String(customers.length)} caption="Terdaftar di cabang ini" icon={<Users size={22} />} tone="violet" />
        <StatCard label="Pelanggan dengan resep" value={String(withResep)} caption="Memiliki arsip resep" icon={<Glasses size={22} />} tone="blue" />
        <StatCard label="Pelanggan dengan PO aktif" value={String(withPo)} caption="Pesanan belum selesai" icon={<MessageSquare size={22} />} tone="amber" />
      </div>

      <section className="section-block">
        {loadError ? <div className="notice" role="alert">{loadError}</div> : null}
        <div className="section-head">
          <div>
            <h2>Daftar Pelanggan</h2>
            <div className="section-desc">Informasi pelanggan dan ringkasan aktivitas</div>
          </div>
          <div className="section-action">
            <span className="foot-note" style={{ color: "var(--muted)", fontSize: 12.5, fontWeight: 700 }}>
              {rows.length} dari {customers.length} data
            </span>
          </div>
        </div>

        <div className="toolbar">
          <SearchBox placeholder="Cari nama, kode, atau nomor HP pelanggan..." value={query} onChange={setQuery} />
          <div className="toolbar-chips">
            <select
              className="chip-select"
              aria-label="Filter Pelanggan"
              value={filter}
              onChange={(e) => setFilter(e.target.value as "Semua" | "Resep" | "PO")}
            >
              <option value="Semua">Semua Pelanggan</option>
              <option value="Resep">Punya Resep</option>
              <option value="PO">PO Aktif</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tt">
            <thead>
              <tr>
                <th>NAMA PELANGGAN</th>
                <th>NOMOR HP</th>
                <th className="tt-center">RESEP</th>
                <th>PO AKTIF</th>
                <th className="tt-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const activePo = poCountOf(c);
                const hasRx = hasResepOf(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-person">
                        <Avatar initials={c.initials} size={40} />
                        <span>
                          <b>{c.name}</b>
                          <span>{c.code}</span>
                        </span>
                      </div>
                    </td>
                    <td>{c.phone}</td>
                    <td className="tt-center">
                      <StatusPill label={hasRx ? "Ada" : "Belum ada"} />
                    </td>
                    <td>
                      <span className="tt-sub" style={{ marginTop: 0 }}>
                        {activePo > 0 ? `${activePo} pesanan` : "Tidak ada"}
                      </span>
                    </td>
                    <td className="tt-right">
                      <span className="row-actions">
                        <button
                          type="button"
                          className="link-action"
                          onClick={() => startEdit(c)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-note">Pelanggan tidak ditemukan.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {open ? (
        <div className="overlay po-modal-overlay" onClick={() => setOpen(false)}>
          <div className="drawer simple-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="simple-modal-head">
              <div className="smh-left">
                <div className="smh-ico">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2>{editing ? "Ubah Data Pelanggan" : "Tambah Pelanggan"}</h2>
                  <p>Lengkapi nama dan nomor kontak pelanggan ({previewCode})</p>
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="drawer-form simple-modal-form" noValidate>
              {formError ? (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              ) : null}

              <label className="afield">
                <span>Nama Pelanggan *</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="cth. Siti Rahma"
                />
              </label>

              <div className="simple-two-col">
                <label className="afield">
                  <span>Nomor HP / WhatsApp *</span>
                  <input
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="cth. 0812 3456 7890"
                  />
                </label>
              </div>

              <label className="afield">
                <span>Alamat (opsional)</span>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Alamat pelanggan"
                  rows={3}
                />
              </label>

              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <UserPlus size={16} />
                  {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
