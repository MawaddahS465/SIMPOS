import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Check,
  ChevronDown,
  CircleDot,
  Glasses,
  Info,
  Minus,
  Package,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useSharedStore, type ProductType } from "../store/sharedStore";
import { Avatar, formatIDR } from "./ui";

type Props = {
  onClose: () => void;
  onCreated: (id: string) => void;
  initialProductId?: string;
};

type Line = { productId: string; qty: number };

function ProductIcon({ type }: { type: ProductType }) {
  if (type === "Frame") return <Glasses size={20} strokeWidth={1.7} />;
  if (type === "Lensa") return <CircleDot size={20} strokeWidth={1.7} />;
  return <Package size={20} strokeWidth={1.7} />;
}

/** Modal Buat PO: pilih pelanggan, susun beberapa produk, lalu simpan sebagai PO Dipesan. */
export default function PoBuilderModal({ onClose, onCreated, initialProductId }: Props) {
  const shared = useSharedStore();
  const products = useMemo(() => shared.products.filter((p) => p.status === "Aktif"), [shared.products]);

  const [customerId, setCustomerId] = useState(shared.customers[0]?.id ?? "");
  const [items, setItems] = useState<Line[]>(() =>
    initialProductId && products.some((p) => p.id === initialProductId)
      ? [{ productId: initialProductId, qty: 1 }]
      : [],
  );
  const [note, setNote] = useState("");
  const [resepId, setResepId] = useState("");
  const [error, setError] = useState("");

  const [custOpen, setCustOpen] = useState(false);
  const [custQuery, setCustQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [catQuery, setCatQuery] = useState("");

  const custWrap = useRef<HTMLDivElement>(null);
  const custSearch = useRef<HTMLInputElement>(null);
  const catSearch = useRef<HTMLInputElement>(null);

  const customer = shared.customers.find((c) => c.id === customerId);
  const reseps = useMemo(
    () => shared.reseps.filter((r) => r.customer === customer?.name),
    [shared.reseps, customer?.name],
  );

  useEffect(() => {
    setResepId(reseps[0]?.id ?? "");
  }, [customerId, reseps.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!custOpen) return;
    const t = window.setTimeout(() => custSearch.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [custOpen]);

  useEffect(() => {
    if (!catOpen) return;
    const t = window.setTimeout(() => catSearch.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [catOpen]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (custWrap.current && !custWrap.current.contains(e.target as Node)) setCustOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (custOpen) return setCustOpen(false);
      if (catOpen) return setCatOpen(false);
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [custOpen, catOpen, onClose]);

  const rows = items.flatMap((it) => {
    const product = products.find((p) => p.id === it.productId);
    return product ? [{ productId: it.productId, qty: it.qty, product }] : [];
  });

  const units = rows.reduce((a, r) => a + r.qty, 0);
  const total = rows.reduce((a, r) => a + r.product.price * r.qty, 0);
  const hasLensa = rows.some((r) => r.product.type === "Lensa");

  const q = custQuery.trim().toLowerCase();
  const filteredCustomers = shared.customers.filter((c) =>
    `${c.name} ${c.code} ${c.phone}`.toLowerCase().includes(q),
  );

  const pq = catQuery.trim().toLowerCase();
  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.brand} ${p.type} ${p.code}`.toLowerCase().includes(pq),
  );

  function addProduct(id: string) {
    setItems((prev) => {
      const hit = prev.find((i) => i.productId === id);
      if (hit) return prev.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { productId: id, qty: 1 }];
    });
    setError("");
  }

  function setQty(id: string, raw: string) {
    const digits = raw.replace(/[^0-9]/g, "");
    const n = digits ? Math.min(999, Number.parseInt(digits, 10)) : 1;
    setItems((prev) => prev.map((i) => (i.productId === id ? { ...i, qty: n } : i)));
  }

  function stepQty(id: string, delta: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === id ? { ...i, qty: Math.min(999, Math.max(1, i.qty + delta)) } : i)),
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Pilih pelanggan terlebih dahulu.");
      return;
    }
    if (!rows.length) {
      setError("Tambahkan minimal satu produk ke daftar pesanan.");
      return;
    }
    const r = shared.createPO({
      customerId,
      items: rows.map((r2) => ({ productId: r2.productId, qty: r2.qty })),
      note,
      actor: "Kasir",
      resepId: hasLensa && resepId ? resepId : undefined,
    });
    if (!r.ok) {
      setError(r.msg);
      return;
    }
    onCreated(r.id ?? "");
  }

  return (
    <div className="po-builder-overlay" onMouseDown={onClose}>
      <div
        className="po-builder"
        role="dialog"
        aria-modal="true"
        aria-label="Buat PO Baru"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="po-builder-head">
          <div className="po-builder-ico">
            <Package size={22} strokeWidth={1.8} />
          </div>
          <div className="po-builder-title">
            <h2>Buat PO Baru</h2>
            <p>Catat pemesanan pelanggan · Status awal: Dipesan</p>
          </div>
          <button type="button" className="po-builder-x" aria-label="Tutup" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="po-builder-form" onSubmit={submit} noValidate>
          <div className="po-builder-body">
            <div className="po-builder-main">
              {error ? (
                <div className="form-error" role="alert">
                  {error}
                </div>
              ) : null}

              <section className="po-field">
                <h3>Pelanggan</h3>
                <div className="po-cust-row">
                  <div className="po-cust-wrap" ref={custWrap}>
                    <button
                      type="button"
                      className={"po-cust-trigger" + (custOpen ? " is-open" : "")}
                      aria-haspopup="listbox"
                      aria-expanded={custOpen}
                      onClick={() => setCustOpen((v) => !v)}
                    >
                      <span className="po-cust-ico">
                        <User size={16} />
                      </span>
                      <span className="po-cust-label">
                        {customer ? `${customer.name} · ${customer.phone}` : "Pilih pelanggan"}
                      </span>
                      <ChevronDown size={17} className="po-cust-chev" />
                    </button>

                    {custOpen ? (
                      <div className="po-cust-menu" role="listbox" aria-label="Pilih pelanggan">
                        <div className="po-cust-search">
                          <Search size={16} />
                          <input
                            ref={custSearch}
                            value={custQuery}
                            onChange={(e) => setCustQuery(e.target.value)}
                            placeholder="Cari nama, kode, atau nomor HP..."
                            aria-label="Cari pelanggan"
                          />
                          {custQuery ? (
                            <button
                              type="button"
                              className="po-cust-clear"
                              aria-label="Bersihkan pencarian"
                              onClick={() => {
                                setCustQuery("");
                                custSearch.current?.focus();
                              }}
                            >
                              <X size={14} />
                            </button>
                          ) : null}
                          <ChevronDown size={15} />
                        </div>

                        <div className="po-cust-list">
                          {filteredCustomers.slice(0, 30).map((c) => (
                            <button
                              type="button"
                              role="option"
                              aria-selected={c.id === customerId}
                              key={c.id}
                              className={"po-cust-opt" + (c.id === customerId ? " is-active" : "")}
                              onClick={() => {
                                setCustomerId(c.id);
                                setCustOpen(false);
                                setCustQuery("");
                              }}
                            >
                              <Avatar initials={c.initials} size={32} />
                              <span className="po-cust-opt-body">
                                <b>{c.name}</b>
                                <span>
                                  {c.code} · {c.phone}
                                </span>
                              </span>
                              {c.id === customerId ? <Check size={15} /> : null}
                            </button>
                          ))}
                          {filteredCustomers.length === 0 ? (
                            <div className="po-cust-empty">Pelanggan tidak ditemukan.</div>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          className="po-cust-more"
                          onClick={() => {
                            setCustQuery("");
                            custSearch.current?.focus();
                          }}
                        >
                          <Search size={15} />
                          Cari lebih banyak pelanggan...
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="po-field">
                <div className="po-prod-head">
                  <h3>Daftar Produk Pesanan</h3>
                  <button type="button" className="po-add-btn" onClick={() => setCatOpen((v) => !v)}>
                    <Search size={15} />
                    Tambah Produk dari Katalog
                  </button>
                </div>

                {catOpen ? (
                  <div className="po-catalog">
                    <div className="po-catalog-search">
                      <Search size={16} />
                      <input
                        ref={catSearch}
                        value={catQuery}
                        onChange={(e) => setCatQuery(e.target.value)}
                        placeholder="Cari nama produk, merek, atau kode..."
                        aria-label="Cari produk"
                      />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCatOpen(false)}>
                        Selesai
                      </button>
                    </div>
                    <div className="po-catalog-list">
                      {filteredProducts.map((p) => {
                        const added = items.some((i) => i.productId === p.id);
                        const saldo = shared.stockOf(p.id)?.saldo;
                        return (
                          <button
                            type="button"
                            key={p.id}
                            className={"po-cat-row" + (added ? " is-added" : "")}
                            onClick={() => addProduct(p.id)}
                          >
                            <span className={`po-thumb is-${p.type.toLowerCase()}`}>
                              <ProductIcon type={p.type} />
                            </span>
                            <span className="po-cat-body">
                              <b>{p.name}</b>
                              <span>
                                {p.type} · {p.brand}
                                {saldo != null ? ` · Stok ${saldo}` : ""}
                              </span>
                            </span>
                            <span className="po-cat-price">{formatIDR(p.price)}</span>
                            <span className="po-cat-add">{added ? <Check size={16} /> : <Plus size={16} />}</span>
                          </button>
                        );
                      })}
                      {filteredProducts.length === 0 ? (
                        <div className="po-cust-empty">Produk tidak ditemukan.</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="po-lines">
                  <div className="po-line-head">
                    <span>No</span>
                    <span>Produk</span>
                    <span>Jenis</span>
                    <span>Harga Satuan</span>
                    <span>Jumlah</span>
                    <span>Subtotal</span>
                    <span>Aksi</span>
                  </div>

                  {rows.map((r, i) => {
                    const saldo = shared.stockOf(r.product.id)?.saldo;
                    return (
                      <div className="po-line" key={r.productId}>
                        <span className="po-line-no">{i + 1}</span>
                        <div className="po-line-prod">
                          <span className={`po-thumb is-${r.product.type.toLowerCase()}`}>
                            <ProductIcon type={r.product.type} />
                          </span>
                          <div className="po-line-body">
                            <b>{r.product.name}</b>
                            <span>{r.product.brand}</span>
                            <span className="po-stock">
                              Stok cabang: {saldo != null ? `${saldo}` : "—"}
                            </span>
                          </div>
                        </div>
                        <span className="po-line-jenis">{r.product.type}</span>
                        <span className="po-line-harga">{formatIDR(r.product.price)}</span>
                        <div className="po-line-qty">
                          <button type="button" aria-label="Kurangi jumlah" onClick={() => stepQty(r.productId, -1)}>
                            <Minus size={14} />
                          </button>
                          <input
                            inputMode="numeric"
                            value={String(r.qty)}
                            aria-label={`Jumlah ${r.product.name}`}
                            onChange={(e) => setQty(r.productId, e.target.value)}
                          />
                          <button type="button" aria-label="Tambah jumlah" onClick={() => stepQty(r.productId, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <b className="po-line-sub">{formatIDR(r.product.price * r.qty)}</b>
                        <button
                          type="button"
                          className="po-line-del"
                          aria-label={`Hapus ${r.product.name}`}
                          onClick={() => setItems((prev) => prev.filter((i) => i.productId !== r.productId))}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}

                  {rows.length === 0 ? (
                    <div className="po-lines-empty">
                      Belum ada produk. Klik <b>Tambah Produk dari Katalog</b> untuk mulai menyusun pesanan.
                    </div>
                  ) : null}
                </div>

                {rows.length > 0 ? (
                  <div className="po-lines-foot">
                    <button type="button" className="link-danger" onClick={() => setItems([])}>
                      <Trash2 size={15} />
                      Hapus Semua
                    </button>
                  </div>
                ) : null}
              </section>

              {hasLensa ? (
                <label className="po-field">
                  <h3>Resep Mata (untuk lensa)</h3>
                  {reseps.length > 0 ? (
                    <select className="po-select" value={resepId} onChange={(e) => setResepId(e.target.value)}>
                      {reseps.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} ({r.date}) — OD {r.od.sph} / OS {r.os.sph} · PD {r.pd} mm
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="po-hint">
                      <Info size={15} />
                      Pelanggan ini belum punya arsip resep di menu Resep Mata.
                    </div>
                  )}
                </label>
              ) : null}

              <label className="po-field">
                <h3>Catatan Pesanan (opsional)</h3>
                <textarea
                  className="po-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: lensa sesuai resep pelanggan, warna frame hitam, dll"
                />
              </label>

              <div className="po-hint">
                <Info size={15} />
                Estimasi total dihitung otomatis berdasarkan produk yang dipilih.
              </div>
            </div>

            <aside className="po-summary">
              <h3>Ringkasan Pesanan</h3>

              <div className="po-sum-row">
                <span>Total Produk</span>
                <b>{rows.length} jenis</b>
              </div>
              <div className="po-sum-row">
                <span>Total Jumlah Barang</span>
                <b>{units} unit</b>
              </div>

              <div className="po-sum-div" />
              <h4>Rincian Harga</h4>

              {rows.length > 0 ? (
                rows.map((r) => (
                  <div className="po-sum-line" key={r.productId}>
                    <span>
                      {r.product.name}
                      <i>{r.product.type}</i>
                    </span>
                    <b>{formatIDR(r.product.price * r.qty)}</b>
                  </div>
                ))
              ) : (
                <div className="po-sum-empty">Belum ada produk dipilih.</div>
              )}

              <div className="po-sum-div" />
              <div className="po-sum-total">
                <span>Total Estimasi</span>
                <b>{formatIDR(total)}</b>
              </div>
            </aside>
          </div>

          <footer className="po-builder-foot">
            <span className="po-foot-hint">
              <Info size={15} />
              Status awal PO adalah <b>Dipesan</b> dan diteruskan ke Admin Cabang.
            </span>
            <div className="po-foot-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                Simpan PO
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
