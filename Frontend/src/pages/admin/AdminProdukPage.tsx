import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus, Power, X } from "lucide-react";
import { FRAME_CATS, LENSA_CATS, type ProductType } from "../../store/sharedStore";
import { adminInventoryApi, ApiError, type AdminCatalogProduct } from "../../lib/api";
import { PageHeader, SearchBox, StatusPill, formatIDR } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type Props = { type: Exclude<ProductType, "Aksesoris"> };
type ProductRow = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  status: "Aktif" | "Nonaktif";
};

const empty = { name: "", brand: "", category: "", price: "" };

function mapProduct(product: AdminCatalogProduct): ProductRow {
  return {
    id: String(product.id),
    code: product.kode_barang,
    name: product.nama_barang,
    brand: product.merek ?? "",
    category: product.nama_kategori ?? "Tanpa kategori",
    price: Number(product.harga_jual),
    status: product.status.toLowerCase() === "aktif" ? "Aktif" : "Nonaktif",
  };
}

export default function AdminProdukPage({ type }: Props) {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"Semua" | "Aktif" | "Nonaktif">("Semua");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cats = type === "Frame" ? FRAME_CATS : LENSA_CATS;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await adminInventoryApi.products(
        type,
        status === "Semua" ? "" : status.toLowerCase(),
        q.trim(),
        category === "all" ? "" : category,
      );
      setProducts(rows.map(mapProduct));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Daftar produk gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [type, status, q, category]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const rows = products;

  const startAdd = () => {
    setEditing(null);
    setForm({ ...empty, category: cats[0] });
    setFormError("");
    setOpen(true);
  };

  const startEdit = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    setEditing(id);
    setForm({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: String(product.price),
    });
    setFormError("");
    setOpen(true);
  };

  useEffect(() => {
    if (params.get("new") !== "1") return;
    startAdd();
    setParams({}, { replace: true });
    // The deep link is consumed once after the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const price = Number(String(form.price).replace(/[^0-9]/g, ""));
    if (!form.name.trim() || !form.brand.trim()) {
      setFormError("Nama dan merek wajib diisi.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError("Harga jual harus lebih dari Rp 0.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        type,
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category,
        price,
      };
      if (editing) {
        await adminInventoryApi.updateProduct(Number(editing), payload);
      } else {
        await adminInventoryApi.createProduct(payload);
      }
      setOpen(false);
      await loadProducts();
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : "Produk gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!confirmId) return;
    setSaving(true);
    setError("");
    try {
      await adminInventoryApi.deactivateProduct(Number(confirmId));
      setConfirmId(null);
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Produk gagal dinonaktifkan.");
      setConfirmId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        overline={type === "Frame" ? "MASTER PRODUK — FRAME" : "MASTER PRODUK — LENSA"}
        title={type === "Frame" ? "Katalog Frame" : "Katalog Lensa"}
        desc={
          type === "Frame"
            ? "Kelola master frame: kategori, harga jual, dan status."
            : "Kelola master lensa: kategori, harga jual, dan status."
        }
        actions={
          <button className="btn btn-primary" onClick={startAdd}>
            <Plus size={16} />
            Tambah Produk
          </button>
        }
      />

      {error ? (
        <div className="notice" role="alert">
          {error}{" "}
          <button className="btn btn-ghost" type="button" onClick={() => void loadProducts()}>
            Coba lagi
          </button>
        </div>
      ) : null}

      <div className="toolbar">
        <SearchBox placeholder={`Cari kode, nama, atau merek ${type.toLowerCase()}...`} value={q} onChange={setQ} />
        <select
          className="chip-select"
          aria-label="Filter Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as "Semua" | "Aktif" | "Nonaktif")}
        >
          <option value="Semua">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        <select
          className="select-pill"
          aria-label="Kategori"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">Semua Kategori</option>
          {cats.map((item) => (
            <option key={item} value={item}>{item}</option>
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
            {loading ? (
              <tr><td colSpan={5}><div className="empty-note">Memuat produk...</div></td></tr>
            ) : rows.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="tt-num">{product.name}</div>
                  <div className="tt-sub">{product.code} · {product.brand}</div>
                </td>
                <td>{product.category}</td>
                <td className="tt-center tt-money">{formatIDR(product.price)}</td>
                <td className="tt-center"><StatusPill label={product.status} /></td>
                <td className="tt-right">
                  <span className="row-actions">
                    <button className="link-action" onClick={() => startEdit(product.id)}>
                      <Pencil size={14} />
                      Ubah
                    </button>
                    {product.status === "Aktif" ? (
                      <button className="link-action link-danger" onClick={() => setConfirmId(product.id)}>
                        <Power size={14} />
                        Nonaktifkan
                      </button>
                    ) : null}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-note">Tidak ada produk yang cocok. Tambahkan produk baru.</div></td></tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Menampilkan {rows.length} produk {type.toLowerCase()}</span>
        </div>
      </div>

      {open ? (
        <div className="overlay" onClick={() => !saving && setOpen(false)}>
          <div className="drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{editing ? "Ubah Produk" : "Tambah Produk"}</h2>
                <div className="section-desc">Master {type}</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)} disabled={saving}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="drawer-form" noValidate>
              {formError ? <div className="form-error" role="alert">{formError}</div> : null}
              <label className="afield">
                <span>Nama produk</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="cth. Titanium Classic" />
              </label>
              <label className="afield">
                <span>Merek</span>
                <input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="cth. Ray-Ban" />
              </label>
              <label className="afield">
                <span>Kategori {type}</span>
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {cats.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="afield">
                <span>Harga jual (Rp)</span>
                <input
                  inputMode="numeric"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  placeholder="cth. 1850000"
                />
              </label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmId ? (
        <div className="overlay" onClick={() => !saving && setConfirmId(null)}>
          <div className="confirm" onClick={(event) => event.stopPropagation()} role="alertdialog" aria-modal="true">
            <h2>Nonaktifkan produk?</h2>
            <p>Produk disembunyikan dari katalog dan riwayatnya tetap tersimpan.</p>
            {error ? <div className="form-error" role="alert">{error}</div> : null}
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setConfirmId(null)} disabled={saving}>Batal</button>
              <button className="btn btn-danger" onClick={() => void deactivate()} disabled={saving}>
                {saving ? "Memproses..." : "Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
