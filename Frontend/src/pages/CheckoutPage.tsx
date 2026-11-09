import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import type { Customer } from "../data/customers";
import type { PaymentMethod } from "../data/mock";
import { useCart } from "../context/CartContext";
import { useAuth } from "../store/auth";
import { ApiError, kasirApi, type ApiCustomer, type ApiProduct, type ApiRecipe } from "../lib/api";
import { mapApiPo, type KasirPo } from "../lib/po";
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
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [cashMode, setCashMode] = useState<"exact" | "manual">(() => {
    const gross = cart.poId ? cart.subtotal : Math.round((cart.subtotal - cart.discount) * 1.11);
    return cart.cashInput.trim() !== "" && cart.cashPaid !== gross ? "manual" : "exact";
  });
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", email: "" });
  const [addError, setAddError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);
  const [po, setPo] = useState<KasirPo | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const taxableSubtotal = cart.poId ? cart.subtotal : cart.subtotal - cart.discount;
  const tax = useMemo(() => cart.poId ? 0 : Math.round((cart.subtotal - cart.discount) * 0.11), [cart.poId, cart.subtotal, cart.discount]);
  const grandTotal = taxableSubtotal + tax;
  const cashShortfall = Math.max(0, grandTotal - cart.cashPaid);
  const cashChange = Math.max(0, cart.cashPaid - grandTotal);

  const rawStep = params.get("step");
  const step: FlowStep = cart.poId
    ? rawStep === "payment" ? "payment" : "confirm"
    : rawStep === "confirm" ? "confirm" : rawStep === "payment" ? "payment" : "customer";
  const current = step === "customer" ? 2 : step === "confirm" ? 3 : 4;

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

  useEffect(() => {
    if (!cart.poId) {
      setPo(null);
      return;
    }
    let active = true;
    kasirApi.order(Number(cart.poId))
      .then((result) => {
        if (active) setPo(mapApiPo(result.order, result.items, result.timeline));
      })
      .catch((error: unknown) => {
        if (active) setWarning(error instanceof Error ? error.message : "Data PO gagal dimuat.");
      });
    return () => {
      active = false;
    };
  }, [cart.poId]);

  // Uang pas selalu mengikuti total terbaru (misalnya setelah diskon diubah).
  useEffect(() => {
    if (cart.method === "Tunai" && cashMode === "exact") {
      cart.setCashInput(String(grandTotal));
    }
  }, [cart.method, grandTotal, cashMode]);

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

  const customer = cart.customer;

  const results = customers.filter((c) =>
    `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase()),
  );

  // Resep aktif dari API, fallback ke snapshot resep PO agar pengambilan PO tetap menampilkan resep.
  const resep = recipe ? {
    od: { sph: recipe.od_sph ?? "-", cyl: recipe.od_cyl ?? "", axis: recipe.od_axis ?? "" },
    os: { sph: recipe.os_sph ?? "-", cyl: recipe.os_cyl ?? "", axis: recipe.os_axis ?? "" },
    pd: recipe.pd ?? "-",
    add: recipe.add_power ?? "-",
  } : po?.resepSnapshot ?? null;

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

  const submitCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      setAddError("Nama dan nomor HP pelanggan wajib diisi.");
      return;
    }
    setAddError("");
    try {
      const row = await kasirApi.createCustomer({
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
        address: "",
      });
      const created: Customer = {
        id: String(row.id_pelanggan),
        code: `PLG-${String(row.id_pelanggan).padStart(4, "0")}`,
        name: row.nama_pelanggan,
        initials: row.nama_pelanggan.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(),
        phone: row.no_hp ?? "-",
        email: addForm.email.trim(),
        hasResep: Number(row.jml_resep ?? 0) > 0,
        poActive: Number(row.po_aktif ?? 0),
        branch: session?.branch ?? "Cabang",
      };
      setCustomers((prev) => [created, ...prev]);
      cart.setCustomer(created);
      setAddOpen(false);
      go("confirm");
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "Pelanggan gagal disimpan.");
    }
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
    // Verifikasi stok dari katalog API sebelum menyimpan transaksi.
    const kurang = cart.poId ? [] : cart.items
      .map((i) => ({ item: i, saldo: products.find((product) => String(product.id) === i.id)?.stok }))
      .filter((x) => x.saldo !== undefined && x.item.qty > (x.saldo as number));
    if (kurang.length > 0) {
      const names = kurang.map((x) => `${x.item.name} (tersedia ${x.saldo})`).join(", ");
      setWarning(`Stok tidak mencukupi: ${names}. Kurangi jumlah atau ajukan PO untuk barang tersebut.`);
      return;
    }

    setIsSaving(true);
    setWarning(null);
    try {
      if (cart.poId) {
        const completed = await kasirApi.completeOrder(
          Number(cart.poId),
          cart.method,
          cart.method === "Tunai" ? cart.cashPaid : undefined,
        );
        const saved = await kasirApi.transaction(completed.transaction.id_transaksi);
        const transaction = saved.transaction;
        const dateTime = new Date(transaction.tanggal_transaksi.replace(" ", "T"));
        cart.complete({
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
          discountPercent: 0,
          total: Number(transaction.total),
          tax: Number(transaction.pajak),
          paid: Number(saved.payment[0]?.jumlah_bayar ?? transaction.jumlah_bayar ?? transaction.total),
          change: Math.max(0, Number(saved.payment[0]?.jumlah_bayar ?? transaction.jumlah_bayar ?? transaction.total) - Number(transaction.total)),
          customer: cart.customer,
          method: String(saved.payment[0]?.metode_pembayaran ?? transaction.metode_pembayaran ?? cart.method) as PaymentMethod,
          poId: cart.poId,
        });
        navigate(`/transaksi-berhasil?id=${transaction.id_transaksi}`);
        return;
      }

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

  const poNotice = po ? (
    <div className="notice notice-ok" role="status">
      <ClipboardList size={16} />
      Transaksi ini menyelesaikan pengambilan <b>{po?.number ?? `PO #${cart.poId}`}</b>
      {po?.customer ? ` untuk ${po.customer}.` : "."}
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
            {!cart.poId ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => go("customer")}>Ubah</button>
            ) : null}
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
            {!cart.poId ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/transaksi-baru")}>
                <Plus size={15} />
                Tambah Produk
              </button>
            ) : null}
          </div>

          {cart.items.length === 0 ? (
            <div className="empty-note">Belum ada produk dipilih.</div>
          ) : (
            cart.items.map((i) => {
              const saldo = products.find((product) => String(product.id) === i.id)?.stok;
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
                      {!cart.poId ? <button onClick={() => cart.setQty(i.id, i.qty - 1)} aria-label="Kurangi"><Minus size={14} /></button> : null}
                      <b>{i.qty}</b>
                      {!cart.poId ? <button onClick={() => cart.setQty(i.id, i.qty + 1)} aria-label="Tambah"><Plus size={14} /></button> : null}
                    </span>
                    <span className="ci-price">{formatIDR(i.price * i.qty)}</span>
                    {!cart.poId ? (
                      <button className="ci-remove" onClick={() => cart.remove(i.id)} aria-label={`Hapus ${i.name}`}>
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                  {!cart.poId && kurangStok ? (
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
          {!cart.poId ? (
            <button type="button" className="btn btn-ghost" onClick={() => go("customer")}>
              <ArrowLeft size={16} />
              Ubah Pelanggan
            </button>
          ) : null}
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
          {!cart.poId ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => go("confirm")}>Ubah Pesanan</button>
          ) : null}
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
                value={cart.poId ? "0" : cart.discountInput}
                onChange={(e) => cart.setDiscountPercent(e.target.value)}
                inputMode="decimal"
                aria-label="Diskon dalam persen"
                disabled={Boolean(cart.poId)}
              />
              <b>{formatIDR(cart.poId ? 0 : cart.discount)}</b>
            </span>
          </div>
          <div className="sum-row">
            <span>{cart.poId ? "Pajak pengambilan PO" : "PPN (11%)"}</span>
            <b>{formatIDR(tax)}</b>
          </div>
          <div className="sum-total">
            <span>Total Pembayaran</span>
            <b>{formatIDR(grandTotal)}</b>
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

            <div className={`cash-change-row ${cashShortfall > 0 ? "is-short" : ""}`}>
              <span>{cashShortfall > 0 ? "Kurang Bayar" : "Kembalian"}</span>
              <b>
                {cashShortfall > 0
                  ? `- ${formatIDR(cashShortfall)}`
                  : formatIDR(cashChange)}
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
          <button type="button" className="btn btn-primary" onClick={finish} disabled={isSaving}>
            {isSaving ? "Menyimpan transaksi..." : "Konfirmasi Transaksi"}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
