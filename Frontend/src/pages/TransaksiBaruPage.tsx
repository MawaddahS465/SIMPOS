import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  ClipboardList,
  Glasses,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { CATEGORIES, type Category } from "../data/catalog";
import { useCart } from "../context/CartContext";
import { kasirApi, type ApiProduct } from "../lib/api";
import { Chip, PageHeader, SearchBox, Steps, formatIDR } from "../components/ui";
import "../styles/pages.css";



export default function TransaksiBaruPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<"Semua" | Category>("Semua");
  const [brand, setBrand] = useState("all");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState("relevan");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    kasirApi.catalog()
      .then((rows) => {
        if (active) setProducts(rows);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Katalog gagal dimuat.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setQuery(q);
  }, [searchParams]);

  const catalog = products.map((p) => ({
    id: String(p.id),
    code: p.kode_barang,
    name: p.nama_barang,
    brand: p.merek ?? "-",
    category: p.jenis as Category,
    price: Number(p.harga_jual),
    saldo: Number(p.stok),
    minimum: Number(p.stok_minimum),
  }));

  const brands = Array.from(new Set(catalog.map((p) => p.brand)));

  const filtered = catalog
    .filter((p) => (tab === "Semua" ? true : p.category === tab))
    .filter((p) => (brand === "all" ? true : p.brand === brand))
    .filter((p) => `${p.name} ${p.brand} ${p.code} ${p.category}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "murah") return a.price - b.price;
      if (sort === "mahal") return b.price - a.price;
      return 0;
    });

  return (
    <div className="page">
      <PageHeader
        overline="TRANSAKSI BARU & CEK STOK CABANG"
        title="Pilih frame dan lensa untuk pelanggan"
        desc="Periksa ketersediaan stok cabang, tambahkan produk ke keranjang, atau ajukan PO bila stok habis."
      />

      <div className="catalog-grid">
        <div className="catalog-main">
          <div className="toolbar">
            <SearchBox
              placeholder="Cari nama produk, merek, atau kode barang..."
              value={query}
              onChange={setQuery}
            />
            <div className="toolbar-chips">
              <select
                className="chip-select"
                aria-label="Kategori"
                value={tab}
                onChange={(e) => setTab(e.target.value as "Semua" | Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "Semua" ? "Semua Kategori" : c}
                  </option>
                ))}
              </select>
              <select
                className="chip-select"
                aria-label="Merek"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                <option value="all">Semua Merek</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                className="chip-select"
                aria-label="Urutkan"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="relevan">Urutkan</option>
                <option value="murah">Harga terendah</option>
                <option value="mahal">Harga tertinggi</option>
              </select>
            </div>
          </div>

          {loadError ? (
            <div className="notice" role="alert">{loadError} Pastikan Backend dan database berjalan.</div>
          ) : null}

          <div className="product-grid">
            {!loadError && products.length === 0 ? (
              <div className="empty-note" style={{ gridColumn: "1 / -1" }}>Memuat katalog dari database...</div>
            ) : null}
            {filtered.map((p) => {
              const outOfStock = p.saldo !== undefined && p.saldo <= 0;
              const lowStock = p.saldo !== undefined && p.saldo > 0 && p.saldo <= p.minimum;
              const inCart = cart.items.find((i) => i.id === p.id);
              const inCartQty = inCart?.qty ?? 0;
              return (
                <div
                  key={p.id}
                  className={`product-card ${inCartQty > 0 ? "is-selected" : ""}`}
                  onClick={() => {
                    if (!outOfStock && inCartQty === 0) cart.add(p);
                  }}
                  style={{ cursor: outOfStock ? "default" : "pointer" }}
                >
                  <div className="product-thumb">
                    {inCartQty > 0 ? (
                      <span className="pc-in-cart-badge">
                        <Check size={12} strokeWidth={2.8} />
                        {inCartQty} di keranjang
                      </span>
                    ) : null}
                    <Glasses size={40} strokeWidth={1.6} />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                      <div className="pc-cat">{p.category.toUpperCase()}</div>
                      <span
                        className="tag-mini"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: outOfStock
                            ? "var(--danger-bg)"
                            : lowStock
                              ? "var(--warn-bg)"
                              : "var(--ok-bg)",
                          color: outOfStock
                            ? "var(--danger-ink)"
                            : lowStock
                              ? "var(--warn-ink)"
                              : "var(--ok-ink)",
                        }}
                      >
                        <Boxes size={11} />
                        {p.saldo === undefined
                          ? "Tersedia"
                          : outOfStock
                            ? "Stok Habis (0)"
                            : lowStock
                              ? `Sisa ${p.saldo} unit`
                              : `Stok ${p.saldo} unit`}
                      </span>
                    </div>
                    <div className="pc-name">{p.name}</div>
                    <div className="pc-brand">
                      {p.brand} · {p.code}
                    </div>
                  </div>
                  <div className="pc-foot">
                    <b>{formatIDR(p.price)}</b>
                    {outOfStock ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/pemesanan?productId=${p.id}`);
                        }}
                      >
                        <ClipboardList size={14} />
                        Buat PO
                      </button>
                    ) : inCartQty > 0 ? (
                      <div
                        className="pc-stepper"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label={`Kurangi ${p.name}`}
                          onClick={() => {
                            if (inCartQty <= 1) cart.remove(p.id);
                            else cart.setQty(p.id, inCartQty - 1);
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <b>{inCartQty}</b>
                        <button
                          type="button"
                          aria-label={`Tambah ${p.name}`}
                          onClick={() => cart.add(p)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pc-add-pill"
                        aria-label={`Tambah ${p.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          cart.add(p);
                        }}
                      >
                        <Plus size={15} strokeWidth={2.5} />
                        Tambah
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 ? (
              <div className="empty-note" style={{ gridColumn: "1 / -1" }}>
                Tidak ada produk yang cocok dengan pencarian atau filter.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="cart-panel">
          <div className="cart-head-rich">
            <div className="cart-head-left">
              <div className="cart-head-icon">
                <ShoppingBag size={19} />
                {cart.count > 0 ? <span className="cart-head-dot">{cart.count}</span> : null}
              </div>
              <div>
                <h2>Keranjang</h2>
              </div>
            </div>
            {cart.items.length > 0 ? (
              <button
                type="button"
                className="cart-clear-btn"
                onClick={() => cart.clear()}
                title="Kosongkan seluruh isi keranjang"
              >
                <Trash2 size={13} />
                Kosongkan
              </button>
            ) : null}
          </div>



          {cart.items.length > 0 ? (
            <div className="cart-items-list">
              {cart.items.map((i) => {
                const saldo = products.find((product) => String(product.id) === i.id)?.stok;
                const overStock = saldo !== undefined && i.qty > saldo;
                return (
                  <div key={i.id} className={`cart-item-card ${overStock ? "is-overstock" : ""}`}>
                    <div className="cic-top">
                      <span className="ci-ico">
                        <Glasses size={20} strokeWidth={1.7} />
                      </span>
                      <div className="cic-info">
                        <div className="cic-cat-row">
                          <span className="cic-cat">{i.category}</span>
                          <span className="cic-unit-price">@ {formatIDR(i.price)}</span>
                        </div>
                        <b>{i.name}</b>
                        <span>{i.brand}</span>
                      </div>
                      <button
                        type="button"
                        className="ci-remove"
                        onClick={() => cart.remove(i.id)}
                        aria-label={`Hapus ${i.name}`}
                        title="Hapus dari keranjang"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="cic-bottom">
                      <div className="cic-stock">
                        {saldo !== undefined ? (
                          <span className={overStock ? "cic-stock-warn" : "cic-stock-ok"}>
                            <Boxes size={12} />
                            Stok cabang: {saldo} unit
                          </span>
                        ) : (
                          <span className="cic-stock-ok">{i.category}</span>
                        )}
                      </div>
                      <div className="cic-controls">
                        <span className="qty-box">
                          <button
                            type="button"
                            onClick={() => {
                              if (i.qty <= 1) cart.remove(i.id);
                              else cart.setQty(i.id, i.qty - 1);
                            }}
                            aria-label="Kurangi"
                          >
                            <Minus size={13} />
                          </button>
                          <b>{i.qty}</b>
                          <button
                            type="button"
                            onClick={() => cart.setQty(i.id, i.qty + 1)}
                            aria-label="Tambah"
                          >
                            <Plus size={13} />
                          </button>
                        </span>
                        <span className="ci-price">{formatIDR(i.price * i.qty)}</span>
                      </div>
                    </div>

                    {overStock ? (
                      <div className="cic-overstock-alert">
                        <span>
                          <AlertTriangle size={12} /> Melebihi stok ({saldo} unit)
                        </span>
                        <Link className="link-action" to={`/pemesanan?productId=${i.id}`} style={{ fontSize: 11.5 }}>
                          Buat PO →
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="cart-summary-box">
            <div className="csb-row">
              <span>Jenis Produk</span>
              <b>{cart.items.length} produk</b>
            </div>
            <div className="csb-row">
              <span>Total Kuantitas</span>
              <b>{cart.count} unit</b>
            </div>
            <div className="csb-total">
              <span>Estimasi Subtotal</span>
              <b>{formatIDR(cart.subtotal)}</b>
            </div>
          </div>

          <Link
            className="btn btn-primary full cart-checkout-btn"
            to="/checkout"
            style={cart.items.length === 0 ? { opacity: 0.55, pointerEvents: "none" } : undefined}
            aria-disabled={cart.items.length === 0}
          >
            <ShoppingBag size={17} />
            {cart.items.length === 0 ? "Pilih Produk Terlebih Dahulu" : `Lanjut ke Checkout (${cart.count} unit)`}
            <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
