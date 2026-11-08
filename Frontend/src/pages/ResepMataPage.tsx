import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, ChevronRight, FileText, Glasses, Pencil, Plus, Printer, Users, X } from "lucide-react";
import { type ResepRecord } from "../data/mock";
import { ApiError, kasirApi, type ApiCustomer, type ApiRecipe } from "../lib/api";
import { Avatar, Chip, PageHeader, SearchBox, StatCard } from "../components/ui";
import MRLogo from "../components/MRLogo";
import "../styles/pages.css";
import "../styles/admin.css";

type Eye = { sph: string; cyl: string; axis: string };
type FormState = { customerId: string; date: string; od: Eye; os: Eye; pd: string; add: string; note: string };

const EYE: Eye = { sph: "", cyl: "", axis: "" };
const EMPTY: FormState = { customerId: "", date: "", od: { ...EYE }, os: { ...EYE }, pd: "", add: "", note: "" };

export default function ResepMataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reseps, setReseps] = useState<ResepRecord[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; code: string; name: string; phone: string; initials: string }>>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Terbaru">("Semua");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [recipeRows, customerRows] = await Promise.all([kasirApi.recipes(), kasirApi.customers()]);
      setCustomers(customerRows.map((customer: ApiCustomer) => ({
        id: String(customer.id_pelanggan),
        code: `PLG-${String(customer.id_pelanggan).padStart(4, "0")}`,
        name: customer.nama_pelanggan,
        phone: customer.no_hp ?? "-",
        initials: customer.nama_pelanggan.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(),
      })));
      setReseps(recipeRows.map((recipe: ApiRecipe): ResepRecord => ({
        id: String(recipe.id_resep),
        customer: recipe.nama_pelanggan,
        initials: recipe.nama_pelanggan.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(),
        date: recipe.tanggal_resep,
        od: { sph: recipe.od_sph ?? "", cyl: recipe.od_cyl ?? "", axis: recipe.od_axis ?? "" },
        os: { sph: recipe.os_sph ?? "", cyl: recipe.os_cyl ?? "", axis: recipe.os_axis ?? "" },
        pd: recipe.pd ?? "",
        add: recipe.add_power ?? "-",
        note: recipe.catatan ?? "-",
        status: recipe.status === "aktif" ? "Aktif" : "Expired",
      })));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Resep gagal dimuat dari database.");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const cid = searchParams.get("customerId");
    if (cid && customers.some((c) => c.id === cid)) {
      setEditingId(null);
      setForm({ ...EMPTY, customerId: cid, od: { ...EYE }, os: { ...EYE } });
      setFormError("");
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, customers, setSearchParams]);

  // Filter "Terbaru" menampilkan resep terbaru per pelanggan; "Semua" menampilkan seluruh riwayat arsip
  const baseRows =
    filter === "Terbaru"
      ? reseps.filter((r, idx, arr) => arr.findIndex((x) => x.customer === r.customer) === idx)
      : reseps;

  // Pencarian mendukung Nama Pelanggan, Nomor HP Pelanggan, Kode Resep, maupun Keterangan (sesuai Dokumen Requirement)
  const rows = baseRows.filter((r) => {
    const cust = customers.find((c) => c.name === r.customer);
    const phone = cust?.phone ?? "";
    return `${r.customer} ${phone} ${r.id} ${r.date} ${r.note ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const rec = selected ? reseps.find((r) => r.id === selected) : undefined;
  const matchedCustomer = rec ? customers.find((c) => c.name === rec.customer) : undefined;
  const uniqueCustomersWithRx = new Set(reseps.map((r) => r.customer)).size;
  const formatDate = (date: string) => {
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  function startAdd() {
    setEditingId(null);
    setForm({ ...EMPTY, customerId: customers[0]?.id ?? "", date: new Date().toISOString().slice(0, 10), od: { ...EYE }, os: { ...EYE } });
    setFormError("");
    setOpen(true);
  }

  function startEdit() {
    if (!rec) return;
    const cust = customers.find((c) => c.name === rec.customer) ?? customers[0];
    setEditingId(rec.id);
    setForm({
      customerId: cust?.id ?? "",
      date: rec.date,
      od: { ...rec.od },
      os: { ...rec.os },
      pd: rec.pd,
      add: rec.add === "-" ? "" : rec.add,
      note: rec.note === "-" ? "" : (rec.note ?? ""),
    });
    setFormError("");
    setOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.od.sph.trim() || !form.os.sph.trim() || !form.pd.trim()) {
      setFormError("SPH mata kanan dan kiri serta PD wajib diisi.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const fields = {
        date: form.date,
        odSph: form.od.sph,
        odCyl: form.od.cyl,
        odAxis: form.od.axis,
        osSph: form.os.sph,
        osCyl: form.os.cyl,
        osAxis: form.os.axis,
        pd: form.pd,
        addPower: form.add,
        notes: form.note,
      };
      if (editingId) {
        await kasirApi.updateRecipe(Number(editingId), fields);
        setNotice(`Data resep ${editingId} berhasil diperbarui.`);
      } else {
        await kasirApi.createRecipe({ customerId: Number(form.customerId), ...fields });
        setNotice("Resep mata baru berhasil dicatat ke database.");
      }
      await loadData();
      setOpen(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Resep gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        overline="ARSIP RESEP"
        title="Resep Mata"
        desc="Catat dan kelola riwayat resep ukuran lensa mata kanan (OD) dan kiri (OS) pelanggan."
        actions={
          <button className="btn btn-primary" onClick={startAdd}>
            <Plus size={16} />
            Tambah Resep
          </button>
        }
      />

      <div className="stat-row">
        <StatCard
          label="Total arsip resep"
          value={String(reseps.length)}
          caption="Tersimpan di cabang ini"
          icon={<Glasses size={22} />}
          tone="violet"
        />
        <StatCard
          label="Pelanggan memiliki resep"
          value={String(uniqueCustomersWithRx)}
          caption="Tercatat dalam arsip digital"
          icon={<Users size={22} />}
          tone="green"
        />
        <StatCard
          label="Pemeriksaan terbaru"
          value={reseps[0]?.date ?? "-"}
          caption={reseps[0] ? `${reseps[0].customer} (${reseps[0].id})` : "Belum ada data"}
          icon={<CalendarDays size={22} />}
          tone="blue"
        />
      </div>

      {notice ? (
        <div className="notice notice-ok" role="status">
          <CheckCircle2 size={16} />
          {notice}
        </div>
      ) : null}
      {loadError ? <div className="notice" role="alert">{loadError}</div> : null}

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Daftar Resep</h2>
            <div className="section-desc">Cari riwayat resep berdasarkan nama atau nomor HP pelanggan</div>
          </div>
        </div>

        <div className="toolbar">
          <SearchBox
            placeholder="Cari nama pelanggan, nomor HP, atau kode resep..."
            value={query}
            onChange={setQuery}
          />
          <div className="toolbar-chips">
            <select
              className="chip-select"
              aria-label="Filter Resep"
              value={filter}
              onChange={(e) => setFilter(e.target.value as "Semua" | "Terbaru")}
            >
              <option value="Semua">Semua Resep</option>
              <option value="Terbaru">Resep Terbaru</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tt">
            <thead>
              <tr>
                <th>TANGGAL</th>
                <th>PELANGGAN</th>
                <th>OD (KANAN)</th>
                <th>OS (KIRI)</th>
                <th>KETERANGAN</th>
                <th className="tt-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cust = customers.find((c) => c.name === r.customer);
                return (
                  <tr
                    key={r.id}
                    className={rec?.id === r.id ? "is-active" : ""}
                    onClick={() => setSelected(r.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="tt-num">{formatDate(r.date)}</div>
                      <div className="tt-sub">{r.id}</div>
                    </td>
                    <td>
                      <div className="cell-person">
                        <Avatar initials={r.initials} size={40} />
                        <span>
                          <b>{r.customer}</b>
                          <span>{cust?.phone ?? r.id}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        SPH {r.od.sph}
                      </div>
                      <div className="tt-sub">
                        CYL {r.od.cyl || "0.00"} · AX {r.od.axis || "-"}
                      </div>
                    </td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        SPH {r.os.sph}
                      </div>
                      <div className="tt-sub">
                        CYL {r.os.cyl || "0.00"} · AX {r.os.axis || "-"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>
                        {r.note && r.note !== "-" ? r.note : "Pemeriksaan ukuran lensa"}
                      </div>
                      <div className="tt-sub">
                        PD {r.pd} mm · ADD {r.add || "-"}
                      </div>
                    </td>
                    <td className="tt-right">
                      <button
                        type="button"
                        className="link-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(r.id);
                        }}
                      >
                        Lihat Detail
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-note">Resep tidak ditemukan.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-foot">
            <span className="foot-note">
              Menampilkan {rows.length} dari {reseps.length} resep
            </span>
          </div>
        </div>
      </section>

      {rec ? (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="drawer" key={rec.id} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div className="detail-head">
                <Avatar initials={rec.initials} size={48} />
                <div>
                  <b>{rec.customer}</b>
                  <span>
                    {rec.id}
                    {matchedCustomer ? ` · ${matchedCustomer.phone}` : ""}
                  </span>
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            <div>
              <div className="mini-label" style={{ color: "var(--accent-ink)" }}>
                UKURAN LENSA (OD &amp; OS)
              </div>
              <div className="rx-mini" style={{ marginTop: 10 }}>
                <div className="rx-eye">
                  <div className="ey-label">OD / MATA KANAN</div>
                  <b>{rec.od.sph}</b>
                  <span>
                    CYL {rec.od.cyl || "0.00"} · AXIS {rec.od.axis || "-"}
                  </span>
                </div>
                <div className="rx-eye">
                  <div className="ey-label">OS / MATA KIRI</div>
                  <b>{rec.os.sph}</b>
                  <span>
                    CYL {rec.os.cyl || "0.00"} · AXIS {rec.os.axis || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-rows">
              <div className="detail-row">
                <span>PD (Pupillary Distance)</span>
                <b>{rec.pd} mm</b>
              </div>
              <div className="detail-row">
                <span>ADD (Baca)</span>
                <b>{rec.add || "-"}</b>
              </div>
              <div className="detail-row">
                <span>Tanggal Resep</span>
                <b>{formatDate(rec.date)}</b>
              </div>
              <div className="detail-row">
                <span>Keterangan / Catatan</span>
                <b>{rec.note && rec.note !== "-" ? rec.note : "-"}</b>
              </div>
            </div>

            <div className="drawer-foot">
              <button type="button" className="btn btn-ghost" onClick={startEdit}>
                <Pencil size={15} />
                Ubah Resep
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setPrintOpen(true)}>
                <Printer size={16} />
                Cetak Resep
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {printOpen && rec ? (
        <div className="overlay" onClick={() => setPrintOpen(false)}>
          <div className="drawer struk-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>Kartu Resep Mata</h2>
                <div className="section-desc">{rec.id} · {rec.customer}</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setPrintOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="struk-print" id="struk-print">
              <div className="struk-brand">
                <div className="struk-logo">
                  <MRLogo size={44} />
                </div>
                <b>Optik Mekar Jaya</b>
                <span>Cabang Padang · (0751) 123456</span>
                <span>Jl. Contoh No. 1, Padang</span>
              </div>

              <div className="struk-meta">
                <div>
                  <span>No. Resep</span>
                  <b>{rec.id}</b>
                </div>
                <div>
                  <span>Tanggal Resep</span>
                  <b>{formatDate(rec.date)}</b>
                </div>
                <div>
                  <span>Pelanggan</span>
                  <b>{rec.customer}</b>
                </div>
                {matchedCustomer ? (
                  <div>
                    <span>No. HP</span>
                    <b>{matchedCustomer.phone}</b>
                  </div>
                ) : null}
                <div>
                  <span>Kasir</span>
                  <b>Korena Saif</b>
                </div>
              </div>

              <div className="struk-items">
                <div className="struk-line">
                  <span>
                    <b>OD (Mata Kanan)</b>
                    <small>
                      SPH {rec.od.sph} · CYL {rec.od.cyl || "0.00"} · AXIS {rec.od.axis || "-"}
                    </small>
                  </span>
                  <b>SPH {rec.od.sph}</b>
                </div>
                <div className="struk-line">
                  <span>
                    <b>OS (Mata Kiri)</b>
                    <small>
                      SPH {rec.os.sph} · CYL {rec.os.cyl || "0.00"} · AXIS {rec.os.axis || "-"}
                    </small>
                  </span>
                  <b>SPH {rec.os.sph}</b>
                </div>
              </div>

              <div className="struk-totals">
                <div>
                  <span>PD (Pupillary Distance)</span>
                  <b>{rec.pd} mm</b>
                </div>
                <div>
                  <span>ADD (Baca / Dekat)</span>
                  <b>{rec.add || "-"}</b>
                </div>
                <div>
                  <span>Catatan</span>
                  <b>{rec.note && rec.note !== "-" ? rec.note : "-"}</b>
                </div>
              </div>

              <div className="struk-foot">
                <span>Arsip Resep Digital · Optik Mekar Jaya</span>
                <span>Simpan kartu ini untuk kemudahan pemesanan lensa</span>
              </div>
            </div>

            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setPrintOpen(false)}>
                Tutup
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} />
                Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="overlay po-modal-overlay" onClick={() => setOpen(false)}>
          <div className="drawer simple-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="simple-modal-head">
              <div className="smh-left">
                <div className="smh-ico">
                  <Glasses size={20} />
                </div>
                <div>
                  <h2>{editingId ? `Ubah Resep (${editingId})` : "Tambah Resep Mata"}</h2>
                  <p>Catat hasil pemeriksaan ukuran mata kanan (OD) &amp; kiri (OS)</p>
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

              <div className="simple-two-col">
                <label className="afield">
                  <span>Pelanggan *</span>
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    disabled={Boolean(editingId)}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.phone} ({c.code})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="afield">
                  <span>Tanggal Pemeriksaan</span>
                  <input
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    type="date"
                  />
                </label>
              </div>

              <div className="simple-rx-box">
                <div className="srb-title">OD — Mata Kanan</div>
                <div className="srb-grid">
                  <label className="afield">
                    <span>SPH *</span>
                    <input value={form.od.sph} onChange={(e) => setForm({ ...form, od: { ...form.od, sph: e.target.value } })} placeholder="-1.50" />
                  </label>
                  <label className="afield">
                    <span>CYL</span>
                    <input value={form.od.cyl} onChange={(e) => setForm({ ...form, od: { ...form.od, cyl: e.target.value } })} placeholder="-0.75" />
                  </label>
                  <label className="afield">
                    <span>AXIS</span>
                    <input value={form.od.axis} onChange={(e) => setForm({ ...form, od: { ...form.od, axis: e.target.value } })} placeholder="180" />
                  </label>
                </div>
              </div>

              <div className="simple-rx-box">
                <div className="srb-title">OS — Mata Kiri</div>
                <div className="srb-grid">
                  <label className="afield">
                    <span>SPH *</span>
                    <input value={form.os.sph} onChange={(e) => setForm({ ...form, os: { ...form.os, sph: e.target.value } })} placeholder="-1.25" />
                  </label>
                  <label className="afield">
                    <span>CYL</span>
                    <input value={form.os.cyl} onChange={(e) => setForm({ ...form, os: { ...form.os, cyl: e.target.value } })} placeholder="-0.50" />
                  </label>
                  <label className="afield">
                    <span>AXIS</span>
                    <input value={form.os.axis} onChange={(e) => setForm({ ...form, os: { ...form.os, axis: e.target.value } })} placeholder="170" />
                  </label>
                </div>
              </div>

              <div className="simple-two-col">
                <label className="afield">
                  <span>PD (mm) *</span>
                  <input value={form.pd} onChange={(e) => setForm({ ...form, pd: e.target.value })} placeholder="cth. 62" />
                </label>
                <label className="afield">
                  <span>ADD (opsional)</span>
                  <input value={form.add} onChange={(e) => setForm({ ...form, add: e.target.value })} placeholder="cth. +1.00" />
                </label>
              </div>

              <label className="afield">
                <span>Keterangan / Catatan (opsional)</span>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="cth. Resep dokter mata / lensa blue control"
                />
              </label>

              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <FileText size={15} />
                  {editingId ? "Simpan Perubahan" : "Simpan Resep"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
