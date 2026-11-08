import { useEffect, useMemo, useState } from "react";
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
import type { Customer } from "../data/customers";
import type { PaymentMethod } from "../data/mock";
import { useCart } from "../context/CartContext";
import { useSharedStore } from "../store/sharedStore";
import { useAuth } from "../store/auth";
import { ApiError, kasirApi, type ApiCustomer, type ApiProduct, type ApiRecipe } from "../lib/api";
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cashMode, setCashMode] = useState<"exact" | "manual">(() =>
    cart.cashInput.trim() !== "" && cart.cashPaid !== Math.round((cart.subtotal - cart.discount) * 1.11) ? "manual" : "exact",
  );

  useEffect(() => {
    let active = true;
    Promise.all([kasirApi.customers(), kasirApi.catalog()])
      .then(([customerRows, catalogRows]) => {
        if (!active) return;
        setCustomers(customerRows.map((row: ApiCustomer): Customer => ({
          id: String(row.id_pelanggan),
          code: `PLG-${String(row.id_pelanggan).padStart(4, "0")}`,
          name: row.nama_pelanggan,
          initials: row.nama_pelanggan.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(),
          phone: row.no_hp ?? "-",
          email: "",
          hasResep: Number(row.jml_resep ?? 0) > 0,
          poActive: Number(row.po_aktif ?? 0),
          branch: session?.branch ?? "Cabang",
        })));
        setProducts(catalogRows);
      })
      .catch((error: unknown) => {
        if (active) setWarning(error instanceof Error ? error.message : "Data checkout gagal dimuat dari server.");
      });
    return () => {
      active = false;
    };
  }, [session?.branch]);

  useEffect(() => {
    const customerId = Number(cart.customer?.id);
    if (!customerId) {
      setRecipe(null);
      return;
    }

    let active = true;
    kasirApi.recipes(customerId, "aktif")
      .then((rows) => {
        if (active) setRecipe(rows[0] ?? null);
      })
      .catch((error: unknown) => {
        if (active) setWarning(error instanceof Error ? error.message : "Resep pelanggan gagal dimuat.");
      });
    return () => {
      active = false;
    };
  }, [cart.customer?.id]);

  const tax = useMemo(() => Math.round((cart.subtotal - cart.discount) * 0.11), [cart.subtotal, cart.discount]);
  const grandTotal = cart.subtotal - cart.discount + tax;

  // Uang pas selalu mengikuti total terbaru (misalnya setelah diskon diubah).
  useEffect(() => {
    if (cart.method === "Tunai" && cashMode === "exact") {
      cart.setCashInput(String(grandTotal));
    }
  }, [cart.method, grandTotal, cashMode]);

  const po = cart.poId ? shared.pos.find((o) => o.id === cart.poId) : undefined;

  const activeCustomer = picking ? null : cart.customer;
  const results = customers.filter((c) =>
    `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase()),
  );

  const resep = recipe ? {
    od: { sph: recipe.od_sph ?? "-", cyl: recipe.od_cyl ?? "", axis: recipe.od_axis ?? "" },
    os: { sph: recipe.os_sph ?? "-", cyl: recipe.os_cyl ?? "", axis: recipe.os_axis ?? "" },
    pd: recipe.pd ?? "-",
    add: recipe.add_power ?? "-",
  } : po?.resepSnapshot ?? null;

  const pick = (c: Customer) => {
    cart.setCustomer(c);
    setPicking(false);
    setQuery("");
    setWarning(null);
  };

  const chooseExactCash = () => {
    setCashMode("exact");
    cart.setCashInput(String(grandTotal));
    setWarning(null);
  };

  const chooseManualCash = () => {
    setCashMode("manual");
    cart.setCashInput("");
    setWarning(null);
  };

  const finish = async () => {
    if (isSaving) return;
    if (cart.items.length === 0) {
      setWarning("Keranjang masih kosong. Tambahkan produk terlebih dahulu.");
      return;
    }
    if (!cart.customer) {
      setWarning("Pilih pelanggan terlebih dahulu sebelum menyelesaikan transaksi.");
      return;
    }
    if (cart.poId) {
      setWarning("Pengambilan PO belum terhubung ke API database. Selesaikan PO melalui alur yang tersedia di Backend.");
      return;
    }
    if (cart.method === "Tunai") {
      if (cart.cashInput.trim() === "") {
        setWarning("Pilih Uang Pas atau masukkan jumlah uang tunai yang dibayar.");
        return;
      }
      if (cart.cashPaid < grandTotal) {
        setWarning(`Jumlah dibayar kurang ${formatIDR(grandTotal - cart.cashPaid)} dari total pembayaran.`);
        return;
      }
    }
    const customerId = Number(cart.customer.id);
    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      setWarning("Pelanggan tidak valid. Pilih pelanggan yang tersimpan di database.");
      return;
    }

    setIsSaving(true);
    setWarning(null);
    try {
      await kasirApi.clearCart();
      for (const item of cart.items) {
        await kasirApi.setCartItem(Number(item.id), item.qty);
      }

      const saved = await kasirApi.checkout({
        customerId,
        paymentMethod: cart.method,
        ...(cart.method === "Tunai" ? { amountPaid: cart.cashPaid } : {}),
        discountAmount: cart.discount,
      });
      const transaction = saved.transaction;
      const dateTime = new Date(transaction.tanggal_transaksi.replace(" ", "T"));
      const persistedReceipt = {
        no: transaction.kode_transaksi,
        date: dateTime.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        time: dateTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"),
        items: saved.items.map((item) => ({
          id: String(item.barang_id),
          name: item.nama_barang,
          brand: item.merek ?? "-",
          category: item.jenis,
          price: Number(item.harga),
          qty: Number(item.jumlah),
        })),
        subtotal: saved.items.reduce((sum, item) => sum + Number(item.subtotal), 0),
        discount: Number(transaction.diskon),
        discountPercent: cart.discountPercent,
        total: Number(transaction.total),
        tax: Number(transaction.pajak),
        paid: Number(transaction.jumlah_bayar ?? transaction.total),
        change: Math.max(0, Number(transaction.jumlah_bayar ?? transaction.total) - Number(transaction.total)),
        customer: cart.customer,
        method: cart.method,
        poId: cart.poId,
      };
      cart.complete(persistedReceipt);
      navigate(`/transaksi-berhasil?id=${transaction.id_transaksi}`);
    } catch (error) {
      if (error instanceof ApiError) setWarning(error.message);
      else setWarning(error instanceof Error ? error.message : "Transaksi gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
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
                const saldo = products.find((product) => String(product.id) === i.id)?.stok;
                const kurangStok = saldo !== undefined && i.qty > Number(saldo);
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

          <div className="sum-row">
            <span>PPN (11%)</span>
            <b>{formatIDR(tax)}</b>
          </div>

          <div className="sum-total">
            <span>Total Pembayaran</span>
            <b>{formatIDR(grandTotal)}</b>
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
                  <b>{formatIDR(grandTotal)}</b>
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
                      placeholder={grandTotal.toLocaleString("id-ID")}
                      value={cart.cashInput}
                      onChange={(e) => {
                        cart.setCashInput(e.target.value);
                        setWarning(null);
                      }}
                    />
                  </div>
                </div>
              )}

              <div className={`cash-change-row ${cart.cashPaid < grandTotal ? "is-short" : ""}`}>
                <span>{cart.cashPaid < grandTotal ? "Kurang Bayar" : "Kembalian"}</span>
                <b>
                  {cart.cashPaid < grandTotal
                  ? `- ${formatIDR(grandTotal - cart.cashPaid)}`
                  : formatIDR(Math.max(0, cart.cashPaid - grandTotal))}
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

          <button className="btn btn-primary full" onClick={finish} disabled={isSaving}>
            {isSaving ? "Menyimpan transaksi..." : "Selesaikan Transaksi"}
          </button>
        </aside>
      </div>
    </div>
  );
}
