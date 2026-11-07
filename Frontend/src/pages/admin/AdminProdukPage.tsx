import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus, Power, X } from "lucide-react";
import { FRAME_CATS, LENSA_CATS, useAdminStore, type ProductType } from "../../store/sharedStore";
import { PageHeader, SearchBox, StatusPill, formatIDR } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type Props = { type: ProductType };

const empty = { name: "", brand: "", category: "", price: "" };

export default function AdminProdukPage({ type }: Props) {
  const store = useAdminStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"Semua" | "Aktif" | "Nonaktif">("Semua");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const cats = type === "Frame" ? FRAME_CATS : LENSA_CATS;
  const rows = useMemo(
    () =>
      store.products
        .filter((p) => p.type === type)
        .filter((p) => (status === "Semua" ? true : p.status === status))
        .filter((p) => `${p.code} ${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())),
    [store.products, type, status, q],
  );

  const startAdd = () => {
    setEditing(null);
    setForm({ ...empty, category: cats[0] });
    setFormError("");
    setOpen(true);
  };

  const startEdit = (id: string) => {
    const p = store.products.find((x) => x.id === id);
    if (!p) return;
    setEditing(id);
    setForm({ name: p.name, brand: p.brand, category: p.category, price: String(p.price) });
    setFormError("");
    setOpen(true);
  };

  // Deep link dari Dashboard: ?new=1 → form tambah produk langsung terbuka.
  useEffect(() => {
    if (params.get("new") !== "1") return;
    setEditing(null);
    setForm({ ...empty, category: cats[0] });
    setFormError("");
    setOpen(true);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const price = Number(String(form.price).replace(/[^0-9]/g, ""));
    const err = store.upsertProduct({
      id: editing ?? undefined,
      name: form.name.trim(),
      brand: form.brand.trim(),
      type,
      category: form.category,
      price,
      status: "Aktif",
    });
    if (err) {
      setFormError(err);
      return;
    }
    setOpen(false);
  };

  return (
    <div className="page">
      <PageHeader
        overline={type === "Frame" ? "MASTER PRODUK — FRAME" : "MASTER PRODUK — LENSA"}
        title={type === "Frame" ? "Katalog Frame" : "Katalog Lensa"}
        desc={
          type === "Frame"
            ? "Kelola master frame cabang: kategori, harga jual, dan status."
            : "Kelola master lensa cabang: kategori, harga jual, dan status."
        }
        actions={
          <button className="btn btn-primary" onClick={startAdd}>
            <Plus size={16} />
            Tambah Produk
          </button>
        }
      />

      <div className="toolbar">
        <SearchBox placeholder={`Cari kode, nama, atau merek ${type.toLowerCase()}...`} value={q} onChange={setQ} />
        <select
          className="chip-select"
          aria-label="Filter Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "Semua" | "Aktif" | "Nonaktif")}
        >
          <option value="Semua">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        <select className="select-pill" aria-label="Kategori" defaultValue="all">
          <option value="all">Semua Kategori</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>KODE / PRODUK</th>
              <th>KATEGORI</th>
              <th className="tt-center">HARGA JUAL</th>
              <th className="tt-center">STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="tt-num">{p.name}</div>
                  <div className="tt-sub">
                    {p.code} · {p.brand}
                  </div>
                </td>
                <td>{p.category}</td>
                <td className="tt-center tt-money">{formatIDR(p.price)}</td>
                <td className="tt-center">
                  <StatusPill label={p.status} />
                </td>
                <td className="tt-right">
                  <span className="row-actions">
                    <button className="link-action" onClick={() => startEdit(p.id)}>
                      <Pencil size={14} />
                      Ubah
                    </button>
                    {p.status === "Aktif" ? (
                      <button className="link-action link-danger" onClick={() => setConfirmId(p.id)}>
                        <Power size={14} />
                        Nonaktifkan
                      </button>
                    ) : null}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-note">Tidak ada produk yang cocok. Tambahkan produk baru.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Menampilkan {rows.length} produk {type.toLowerCase()}
          </span>
        </div>
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{editing ? "Ubah Produk" : "Tambah Produk"}</h2>
                <div className="section-desc">Master {type} · Cabang Padang</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="drawer-form" noValidate>
              {formError ? (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              ) : null}
              <label className="afield">
                <span>Nama produk</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth. Titanium Classic" />
              </label>
              <label className="afield">
                <span>Merek</span>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="cth. Ray-Ban" />
              </label>
              <label className="afield">
                <span>Kategori {type}</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {cats.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="afield">
                <span>Harga jual (Rp)</span>
                <input
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="cth. 1850000"
                />
              </label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmId ? (
        <div className="overlay" onClick={() => setConfirmId(null)}>
          <div className="confirm" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <h2>Nonaktifkan produk?</h2>
            <p>Produk disembunyikan dari katalog (soft delete) dan riwayatnya tetap tersimpan.</p>
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>
                Batal
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  store.deactivateProduct(confirmId);
                  setConfirmId(null);
                }}
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
