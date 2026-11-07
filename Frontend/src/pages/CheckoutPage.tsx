import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Banknote,
  Building2,
  ClipboardList,
  CreditCard,
  Glasses,
  Minus,
  Plus,
  QrCode,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { RESEP_MAP, type Customer } from "../data/customers";
import type { PaymentMethod } from "../data/mock";
import { useCart } from "../context/CartContext";
import { useSharedStore } from "../store/sharedStore";
import { useAuth } from "../store/auth";
import { Avatar, PageHeader, Steps, formatIDR } from "../components/ui";
import "../styles/pages.css";

const METHODS: Array<{ id: PaymentMethod; label: string; desc: string; icon: typeof Banknote }> = [
  { id: "Tunai", label: "Tunai", desc: "Pembayaran dengan uang tunai", icon: Banknote },
  { id: "Transfer Bank", label: "Transfer Bank", desc: "Pembayaran melalui transfer bank", icon: Building2 },
  { id: "Kartu Debit/Kredit", label: "Kartu Debit/Kredit", desc: "Visa, Mastercard, JCB, dll", icon: CreditCard },
  { id: "QRIS", label: "QRIS", desc: "Pembayaran dengan QRIS", icon: QrCode },
];

export default function CheckoutPage() {
  const cart = useCart();
  const shared = useSharedStore();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [cashMode, setCashMode] = useState<"exact" | "manual">(() =>
    cart.cashInput.trim() !== "" && cart.cashPaid !== cart.total ? "manual" : "exact",
  );

  // Uang pas selalu mengikuti total terbaru (misalnya setelah diskon diubah).
  useEffect(() => {
    if (cart.method === "Tunai" && cashMode === "exact") {
      cart.setCashInput(String(cart.total));
    }
  }, [cart.method, cart.total, cashMode]);

  const po = cart.poId ? shared.pos.find((o) => o.id === cart.poId) : undefined;

  const activeCustomer = picking ? null : cart.customer;
  const results = shared.customers.filter((c) =>
    `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase()),
  );

  // Resep aktif dari sharedStore (termasuk resep baru yang dicatat Kasir), fallback ke RESEP_MAP seed,
  // lalu ke snapshot resep PO agar pengambilan PO tetap menampilkan resep walau pelanggan belum terdaftar.
  const resep = cart.customer
    ? (shared.reseps.find((r) => r.customer === cart.customer?.name && r.status === "Aktif") ??
      RESEP_MAP[cart.customer.id] ??
      po?.resepSnapshot ??
      null)
    : (po?.resepSnapshot ?? null);

  const pick = (c: Customer) => {
    cart.setCustomer(c);
    setPicking(false);
    setQuery("");
    setWarning(null);
  };

  const chooseExactCash = () => {
    setCashMode("exact");
    cart.setCashInput(String(cart.total));
    setWarning(null);
  };

  const chooseManualCash = () => {
    setCashMode("manual");
    cart.setCashInput("");
    setWarning(null);
  };

  const finish = () => {
    if (cart.items.length === 0) {
      setWarning("Keranjang masih kosong. Tambahkan produk terlebih dahulu.");
      return;
    }
    if (!cart.customer) {
      setWarning("Pilih pelanggan terlebih dahulu sebelum menyelesaikan transaksi.");
      return;
    }
    if (cart.method === "Tunai") {
      if (cart.cashInput.trim() === "") {
        setWarning("Pilih Uang Pas atau masukkan jumlah uang tunai yang dibayar.");
        return;
      }
      if (cart.cashPaid < cart.total) {
        setWarning(`Jumlah dibayar kurang ${formatIDR(cart.total - cart.cashPaid)} dari total pembayaran.`);
        return;
      }
    }
    if (cart.poId && (!po || po.linkedTrx || po.status !== "Sudah Datang")) {
      setWarning(
        po?.linkedTrx
          ? `PO ${po.number} sudah diselesaikan oleh transaksi ${po.linkedTrx}.`
          : "PO yang diambil sudah tidak berstatus Sudah Datang. Muat ulang halaman PO.",
      );
      return;
    }
    // Verifikasi stok di sumber otoritatif (bukan angka dari browser saja).
    const kurang = cart.items
      .map((i) => ({ item: i, saldo: shared.stockOf(i.id)?.saldo }))
      .filter((x) => x.saldo !== undefined && x.item.qty > (x.saldo as number));
    if (kurang.length > 0) {
      const names = kurang.map((x) => `${x.item.name} (tersedia ${x.saldo})`).join(", ");
      setWarning(`Stok tidak mencukupi: ${names}. Kurangi jumlah atau ajukan PO untuk barang tersebut.`);
      return;
    }
    // Penjualan sukses mengurangi stok SATU KALI + mutasi OUT (idempoten via no. struk).
    const receipt = cart.complete();
    const result = shared.recordSale(
      receipt.items.map((i) => ({ id: i.id, name: i.name, brand: i.brand, qty: i.qty, price: i.price })),
      receipt.no,
      session?.name ?? "Kasir",
      receipt.method,
      receipt.discount,
      receipt.paid,
      receipt.change,
      receipt.customer ? { name: receipt.customer.name, phone: receipt.customer.phone } : null,
      receipt.poId,
    );
    if (!result.ok) {
      setWarning(result.msg);
      return;
    }
    navigate("/transaksi-berhasil");
  };

  return (
    <div className="page">
      <PageHeader
        overline="CHECKOUT"
        title="Lengkapi data transaksi dan selesaikan pembayaran"
        desc="Pastikan data pelanggan, resep, dan ketersediaan stok produk sudah sesuai sebelum memproses pembayaran."
        actions={<Steps current={2} />}
      />

      {po ? (
        <div className="notice notice-ok" role="status">
          <ClipboardList size={16} />
          Transaksi ini menyelesaikan pengambilan <b>{po.number}</b> untuk {po.customer}.
          <button
            type="button"
            className="link-action"
            style={{ marginLeft: "auto" }}
            onClick={() => cart.setPoId(null)}
          >
            Lepas tautan PO
          </button>
        </div>
      ) : null}

      <div className="checkout-grid">
        <div className="checkout-left">
          {/* Data Pelanggan */}
          <section className="co-card">
            <div className="section-head">
              <h2>Data Pelanggan</h2>
            </div>

            {activeCustomer ? (
              <div className="cust-card">
                <Avatar initials={activeCustomer.initials} size={46} />
                <div className="cc-body">
                  <b>{activeCustomer.name}</b>
                  <div className="cc-meta">
                    <span>{activeCustomer.code}</span>
                    <span>{activeCustomer.phone}</span>
                  </div>
                  <div className="cc-meta">{activeCustomer.email}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setPicking(true)}>
                  Ubah
                </button>
              </div>
            ) : (
              <div>
                <label className="toolbar-search" style={{ marginBottom: 12 }}>
                  <Glasses size={16} />
                  <input
                    type="search"
                    placeholder="Cari pelanggan (nama, nomor HP, atau kode)."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <div className="cust-pick">
                  {results.map((c) => (
                    <button key={c.id} className="cust-pick-row" onClick={() => pick(c)}>
                      <Avatar initials={c.initials} size={40} />
                      <span className="pick-body">
                        <b>{c.name}</b>
                        <span>
                          {c.code} · {c.phone}
                        </span>
                      </span>
                    </button>
                  ))}
                  {results.length === 0 ? <div className="empty-note">Pelanggan tidak ditemukan.</div> : null}
                </div>
              </div>
            )}
          </section>

          {/* Resep Mata */}
          <section className="co-card">
            <div className="section-head">
              <h2>Resep Mata</h2>
            </div>
            {resep ? (
              <table className="rx-table">
                <thead>
                  <tr>
                    <th>Mata</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXIS</th>
                    <th>ADD</th>
                    <th>PD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>OD (Kanan)</td>
                    <td>{resep.od.sph}</td>
                    <td>{resep.od.cyl || "0.00"}</td>
                    <td>{resep.od.axis || "-"}</td>
                    <td>{resep.add ?? "-"}</td>
                    <td>{resep.pd}</td>
                  </tr>
                  <tr>
                    <td>OS (Kiri)</td>
                    <td>{resep.os.sph}</td>
                    <td>{resep.os.cyl || "0.00"}</td>
                    <td>{resep.os.axis || "-"}</td>
                    <td>{resep.add ?? "-"}</td>
                    <td>{resep.pd}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="empty-note">
                Belum ada resep tersimpan untuk pelanggan ini.
              </div>
            )}
          </section>

          {/* Produk Dipilih */}
          <section className="co-card">
            <div className="section-head">
              <h2>Produk Dipilih</h2>
              <div className="section-action">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("/transaksi-baru")}>
                  <Plus size={15} />
                  Tambah Produk
                </button>
              </div>
            </div>

            {cart.items.length === 0 ? (
              <div className="empty-note">Belum ada produk dipilih.</div>
            ) : (
              cart.items.map((i) => {
                const saldo = shared.stockOf(i.id)?.saldo;
                const kurangStok = saldo !== undefined && i.qty > saldo;
                return (
                  <div key={i.id} className="cart-line" style={{ flexWrap: "wrap" }}>
                    <span className="cl-ico">
                      <Glasses size={20} strokeWidth={1.7} />
                    </span>
                    <span className="cl-body">
                      <b>{i.name}</b>
                      <span>
                        {i.brand} · {i.category}
                        {saldo !== undefined ? ` · Stok cabang: ${saldo} unit` : ""}
                      </span>
                    </span>
                    <span className="qty-box">
                      <button onClick={() => cart.setQty(i.id, i.qty - 1)} aria-label="Kurangi">
                        <Minus size={14} />
                      </button>
                      <b>{i.qty}</b>
                      <button onClick={() => cart.setQty(i.id, i.qty + 1)} aria-label="Tambah">
                        <Plus size={14} />
                      </button>
                    </span>
                    <span className="ci-price">{formatIDR(i.price * i.qty)}</span>
                    <button className="ci-remove" onClick={() => cart.remove(i.id)} aria-label={`Hapus ${i.name}`}>
                      <Trash2 size={16} />
                    </button>
                    {kurangStok ? (
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 6,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "var(--danger-bg)",
                          color: "var(--danger-ink)",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <span>Stok cabang hanya tersedia {saldo} unit (diminta {i.qty} unit).</span>
                        <Link className="btn btn-ghost btn-sm" to={`/pemesanan?productId=${i.id}`}>
                          <ClipboardList size={14} />
                          Buat PO
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* Ringkasan Transaksi */}
        <aside className="summary">
          <div className="cart-head">
            <h2>Ringkasan Transaksi</h2>
            <span className="cart-count">{cart.count} produk</span>
          </div>

          <div className="sum-row">
            <span>Subtotal</span>
            <b>{formatIDR(cart.subtotal)}</b>
          </div>
          <div className="sum-row">
            <span>% Diskon</span>
            <span className="sum-inline">
              <input
                className="sum-input"
                value={cart.discountInput}
                onChange={(e) => cart.setDiscountPercent(e.target.value)}
                inputMode="decimal"
                aria-label="Diskon dalam persen"
              />
              <b>{formatIDR(cart.discount)}</b>
            </span>
          </div>

          <div className="sum-total">
            <span>Total</span>
            <b>{formatIDR(cart.total)}</b>
          </div>

          <div className="mini-label" style={{ letterSpacing: 1.3 }}>
            METODE PEMBAYARAN
          </div>
          <div className="pay-list">
            {METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  className={`pay-opt ${cart.method === m.id ? "on" : ""}`}
                  onClick={() => {
                    cart.setMethod(m.id);
                    setWarning(null);
                  }}
                >
                  <span className="po-ico">
                    <Icon size={18} />
                  </span>
                  <span className="po-body">
                    <b>{m.label}</b>
                    <span>{m.desc}</span>
                  </span>
                  <span className="radio-dot" />
                </button>
              );
            })}
          </div>

          {cart.method === "Tunai" ? (
            <div className="cash-box">
              <div className="cash-mode-toggle" role="group" aria-label="Cara pembayaran tunai">
                <button
                  type="button"
                  className={`cash-mode-btn ${cashMode === "exact" ? "on" : ""}`}
                  aria-pressed={cashMode === "exact"}
                  onClick={chooseExactCash}
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  className={`cash-mode-btn ${cashMode === "manual" ? "on" : ""}`}
                  aria-pressed={cashMode === "manual"}
                  onClick={chooseManualCash}
                >
                  Input Manual
                </button>
              </div>

              {cashMode === "exact" ? (
                <div className="cash-exact-display">
                  <span>Jumlah Dibayar</span>
                  <b>{formatIDR(cart.total)}</b>
                </div>
              ) : (
                <div className="cash-field">
                  <div className="cash-label-row">
                    <label htmlFor="cash-paid-input">Jumlah Dibayar</label>
                  </div>
                  <div className="cash-input-wrap">
                    <span className="cash-prefix">Rp</span>
                    <input
                      id="cash-paid-input"
                      type="text"
                      inputMode="numeric"
                      placeholder={cart.total.toLocaleString("id-ID")}
                      value={cart.cashInput}
                      onChange={(e) => {
                        cart.setCashInput(e.target.value);
                        setWarning(null);
                      }}
                    />
                  </div>
                </div>
              )}

              <div className={`cash-change-row ${cart.cashShortfall > 0 ? "is-short" : ""}`}>
                <span>{cart.cashShortfall > 0 ? "Kurang Bayar" : "Kembalian"}</span>
                <b>
                  {cart.cashShortfall > 0
                    ? `- ${formatIDR(cart.cashShortfall)}`
                    : formatIDR(cart.cashChange)}
                </b>
              </div>
            </div>
          ) : null}

          {warning ? (
            <div className="notice">
              <TriangleAlert size={16} />
              {warning}
            </div>
          ) : null}

          <button className="btn btn-primary full" onClick={finish}>
            Selesaikan Transaksi
          </button>
        </aside>
      </div>
    </div>
  );
}
