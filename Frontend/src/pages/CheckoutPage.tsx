import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Eye,
  Glasses,
  Minus,
  Package,
  Plus,
  QrCode,
  Search,
  Trash2,
  TriangleAlert,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { RESEP_MAP, type Customer } from "../data/customers";
import type { PaymentMethod } from "../data/mock";
import { useCart } from "../context/CartContext";
import { useSharedStore } from "../store/sharedStore";
import { useAuth } from "../store/auth";
import { Avatar, formatIDR } from "../components/ui";
import "../styles/pages.css";

const METHODS: Array<{ id: PaymentMethod; label: string; desc: string; icon: typeof Banknote }> = [
  { id: "Tunai", label: "Tunai", desc: "Pembayaran dengan uang tunai", icon: Banknote },
  { id: "Transfer Bank", label: "Transfer Bank", desc: "Pembayaran melalui transfer bank", icon: Building2 },
  { id: "Kartu Debit/Kredit", label: "Kartu Debit/Kredit", desc: "Visa, Mastercard, JCB, dll", icon: CreditCard },
  { id: "QRIS", label: "QRIS", desc: "Pembayaran dengan QRIS", icon: QrCode },
  { id: "E-Wallet", label: "E-Wallet", desc: "OVO, GoPay, DANA, ShopeePay", icon: Wallet },
];

const FLOW_STEPS = ["Pilih Produk", "Pilih Pelanggan", "Konfirmasi", "Pembayaran", "Selesai"] as const;

type FlowStep = "customer" | "confirm" | "payment";

function CheckoutSteps({ current }: { current: 2 | 3 | 4 | 5 }) {
  return (
    <div className="co-stepper" aria-label="Langkah transaksi">
      {FLOW_STEPS.map((label, index) => {
        const number = index + 1;
        return (
          <div
            key={label}
            className={`co-step ${number < current ? "done" : ""} ${number === current ? "active" : ""}`}
          >
            <span className="co-step-dot">{number}</span>
            <span className="co-step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProductIcon({ category }: { category: string }) {
  if (category === "Aksesoris") return <Package size={20} strokeWidth={1.7} />;
  if (category === "Lensa") return <Eye size={20} strokeWidth={1.7} />;
  return <Glasses size={20} strokeWidth={1.7} />;
}

export default function CheckoutPage() {
  const cart = useCart();
  const shared = useSharedStore();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [cashMode, setCashMode] = useState<"exact" | "manual">(() =>
    cart.cashInput.trim() !== "" && cart.cashPaid !== cart.total ? "manual" : "exact",
  );
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", email: "" });
  const [addError, setAddError] = useState("");

  const rawStep = params.get("step");
  const step: FlowStep = rawStep === "confirm" ? "confirm" : rawStep === "payment" ? "payment" : "customer";
  const current = step === "customer" ? 2 : step === "confirm" ? 3 : 4;

  // Uang pas selalu mengikuti total terbaru (misalnya setelah diskon diubah).
  useEffect(() => {
    if (cart.method === "Tunai" && cashMode === "exact") {
      cart.setCashInput(String(cart.total));
    }
  }, [cart.method, cart.total, cashMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Jangan biarkan langkah lanjutan terbuka tanpa produk/pelanggan.
  useEffect(() => {
    if (cart.receipt) return;
    if (cart.items.length === 0) {
      navigate("/transaksi-baru", { replace: true });
      return;
    }
    if (step !== "customer" && !cart.customer) {
      setParams({}, { replace: true });
    }
  }, [cart.receipt, cart.items.length, cart.customer, step, navigate, setParams]);

  const po = cart.poId ? shared.pos.find((o) => o.id === cart.poId) : undefined;
  const customer = cart.customer;

  const results = shared.customers.filter((c) =>
    `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase()),
  );

  // Resep aktif dari sharedStore (termasuk resep baru yang dicatat Kasir), fallback ke RESEP_MAP seed,
  // lalu ke snapshot resep PO agar pengambilan PO tetap menampilkan resep walau pelanggan belum terdaftar.
  const resep = customer
    ? (shared.reseps.find((r) => r.customer === customer.name && r.status === "Aktif") ??
      RESEP_MAP[customer.id] ??
      po?.resepSnapshot ??
      null)
    : (po?.resepSnapshot ?? null);

  const go = (next: FlowStep) => {
    setWarning(null);
    setParams(next === "customer" ? {} : { step: next });
  };

  const pick = (c: Customer) => {
    cart.setCustomer(c);
    setQuery("");
    setWarning(null);
    go("confirm");
  };

  const openAddCustomer = () => {
    setAddForm({ name: "", phone: "", email: "" });
    setAddError("");
    setAddOpen(true);
  };

  const submitCustomer = (e: FormEvent) => {
    e.preventDefault();
    const result = shared.upsertCustomer(addForm);
    if (!result.ok || !result.customer) {
      setAddError(result.msg);
      return;
    }
    cart.setCustomer(result.customer);
    setAddOpen(false);
    go("confirm");
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

  const poNotice = po ? (
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
  ) : null;

  if (step === "customer") {
    return (
      <div className="page co-flow">
        <CheckoutSteps current={2} />

        <section className="co-card co-pick-card">
          <div className="section-head">
            <div>
              <h2>Pilih Pelanggan</h2>
              <div className="section-desc">
                Pelanggan dipilih sebelum memeriksa resep dan produk transaksi.
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={openAddCustomer}>
              <UserPlus size={15} />
              Tambah Pelanggan
            </button>
          </div>

          <label className="toolbar-search co-search" aria-label="Cari pelanggan">
            <Search size={16} />
            <input
              type="search"
              placeholder="Cari nama, nomor HP, atau kode pelanggan."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div className="cust-pick co-cust-pick">
            {results.map((c) => (
              <button key={c.id} type="button" className="cust-pick-row" onClick={() => pick(c)}>
                <Avatar initials={c.initials} size={40} />
                <span className="pick-body">
                  <b>{c.name}</b>
                  <span>
                    {c.code} · {c.phone}
                  </span>
                </span>
                <ChevronRight size={18} className="co-row-chevron" />
              </button>
            ))}
            {results.length === 0 ? <div className="empty-note">Pelanggan tidak ditemukan.</div> : null}
          </div>

          <button
            type="button"
            className="btn btn-ghost full"
            onClick={() => navigate("/transaksi-baru")}
          >
            <ArrowLeft size={16} />
            Kembali ke Pilih Produk
          </button>
        </section>

        {addOpen ? (
          <div className="overlay po-modal-overlay" onClick={() => setAddOpen(false)}>
            <div className="drawer simple-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="simple-modal-head">
                <div className="smh-left">
                  <div className="smh-ico">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2>Tambah Pelanggan</h2>
                    <p>Lengkapi nama dan nomor kontak pelanggan baru.</p>
                  </div>
                </div>
                <button className="icon-pill" aria-label="Tutup" onClick={() => setAddOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submitCustomer} className="drawer-form simple-modal-form" noValidate>
                {addError ? (
                  <div className="form-error" role="alert">
                    {addError}
                  </div>
                ) : null}

                <label className="afield">
                  <span>Nama Pelanggan *</span>
                  <input
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="cth. Siti Rahma"
                  />
                </label>

                <div className="simple-two-col">
                  <label className="afield">
                    <span>Nomor HP / WhatsApp *</span>
                    <input
                      inputMode="tel"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      placeholder="cth. 0812 3456 7890"
                    />
                  </label>

                  <label className="afield">
                    <span>Email (opsional)</span>
                    <input
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      placeholder="nama@email.com"
                    />
                  </label>
                </div>

                <div className="drawer-foot">
                  <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <UserPlus size={16} />
                    Simpan Pelanggan
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (!customer) return null;

  if (step === "confirm") {
    return (
      <div className="page co-flow">
        <CheckoutSteps current={3} />
        {poNotice}

        <section className="co-card">
          <div className="section-head">
            <h2>Data Pelanggan</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => go("customer")}>
              Ubah
            </button>
          </div>
          <div className="cust-card">
            <Avatar initials={customer.initials} size={46} />
            <div className="cc-body">
              <b>{customer.name}</b>
              <div className="cc-meta">
                <span>{customer.code}</span>
                <span>{customer.phone}</span>
                {customer.email ? <span>{customer.email}</span> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="co-card">
          <div className="section-head">
            <h2>Resep Mata</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/resep-mata")}>
              <Glasses size={15} />
              Lihat Arsip Resep
            </button>
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
            <div className="empty-note">Belum ada resep tersimpan untuk pelanggan ini.</div>
          )}
        </section>

        <section className="co-card">
          <div className="section-head">
            <h2>Produk Dipilih</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/transaksi-baru")}>
              <Plus size={15} />
              Tambah Produk
            </button>
          </div>

          {cart.items.length === 0 ? (
            <div className="empty-note">Belum ada produk dipilih.</div>
          ) : (
            cart.items.map((i) => {
              const saldo = shared.stockOf(i.id)?.saldo;
              const kurangStok = saldo !== undefined && i.qty > saldo;
              return (
                <div key={i.id}>
                  <div className="co-product-line">
                    <span className="cl-ico">
                      <ProductIcon category={i.category} />
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
                  </div>
                  {kurangStok ? (
                    <div className="co-stock-warn">
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

        <div className="co-flow-actions">
          <button type="button" className="btn btn-ghost" onClick={() => go("customer")}>
            <ArrowLeft size={16} />
            Ubah Pelanggan
          </button>
          <button type="button" className="btn btn-primary" onClick={() => go("payment")}>
            Lanjut ke Ringkasan
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page co-flow">
      <CheckoutSteps current={4} />
      {poNotice}

      <section className="co-card co-pay-card">
        <div className="section-head">
          <div>
            <h2>Ringkasan Pesanan</h2>
            <div className="section-desc">
              {customer.name} · {customer.code}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => go("confirm")}>
            Ubah Pesanan
          </button>
        </div>

        <div>
          {cart.items.map((i) => (
            <div key={i.id} className="co-product-line">
              <span className="cl-ico">
                <ProductIcon category={i.category} />
              </span>
              <span className="cl-body">
                <b>{i.name}</b>
                <span>
                  {i.brand} · {i.category} · {i.qty} × {formatIDR(i.price)}
                </span>
              </span>
              <span className="ci-price">{formatIDR(i.price * i.qty)}</span>
            </div>
          ))}
        </div>

        <div className="co-pay-totals">
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
                type="button"
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

        <div className="co-flow-actions">
          <button type="button" className="btn btn-ghost" onClick={() => go("confirm")}>
            <ArrowLeft size={16} />
            Periksa Kembali
          </button>
          <button type="button" className="btn btn-primary" onClick={finish}>
            Konfirmasi Transaksi
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
