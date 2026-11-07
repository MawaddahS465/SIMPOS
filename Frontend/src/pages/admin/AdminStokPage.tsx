import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, Settings2 } from "lucide-react";
import { useAdminStore } from "../../store/sharedStore";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function AdminStokPage() {
  const store = useAdminStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Aman" | "Menipis">("Semua");
  const [minFor, setMinFor] = useState<string | null>(null);
  const [minVal, setMinVal] = useState("");
  const [minError, setMinError] = useState("");

  const rows = useMemo(
    () =>
      store.stock
        .map((s) => ({ s, p: store.productOf(s.productId)! }))
        .filter(({ p }) => p && p.status === "Aktif")
        .map(({ s, p }) => ({ p, saldo: s.saldo, minimum: s.minimum, low: s.saldo <= s.minimum }))
        .filter(({ low }) => (filter === "Semua" ? true : filter === "Menipis" ? low : !low))
        .filter(({ p }) => `${p.code} ${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())),
    [store, q, filter],
  );

  const submitMin = (e: FormEvent) => {
    e.preventDefault();
    const v = Number(minVal);
    if (!Number.isInteger(v) || v < 0) {
      setMinError("Batas minimum harus bilangan bulat ≥ 0.");
      return;
    }
    if (minFor) store.setMinimum(minFor, v);
    setMinFor(null);
  };

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN CABANG"
        title="Stok Cabang"
        desc="Saldo, batas minimum, dan status tiap produk di Cabang Padang. Saldo hanya berubah lewat penerimaan atau penjualan — bukan edit manual."
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari kode, nama, atau merek produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          <select
            className="chip-select"
            aria-label="Filter Status Stok"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "Semua" | "Aman" | "Menipis")}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aman">Aman</option>
            <option value="Menipis">Menipis ({store.lowStock.length})</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>KODE / NAMA PRODUK</th>
              <th>JENIS</th>
              <th className="tt-center">STOK SAAT INI</th>
              <th className="tt-center">BATAS MINIMUM</th>
              <th className="tt-center">STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, saldo, minimum, low }) => (
              <tr key={p.id}>
                <td>
                  <div className="tt-num">{p.name}</div>
                  <div className="tt-sub">
                    {p.code} · {p.brand}
                  </div>
                </td>
                <td>{p.type}</td>
                <td className="tt-center tt-money">{saldo}</td>
                <td className="tt-center tt-money">{minimum}</td>
                <td className="tt-center">
                  <StatusPill label={low ? "Stok Menipis" : "Aman"} />
                </td>
                <td className="tt-right">
                  <span className="row-actions">
                    <button
                      className="link-action"
                      onClick={() => {
                        setMinFor(p.id);
                        setMinVal(String(minimum));
                        setMinError("");
                      }}
                    >
                      <Settings2 size={14} />
                      Atur Minimum
                    </button>
                    <Link className="link-action" to={`/admin/pengajuan?product=${p.id}`}>
                      <FilePlus2 size={14} />
                      Ajukan Stok
                    </Link>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-note">Tidak ada stok yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            {store.lowStock.length} produk menipis · saldo ≤ minimum
          </span>
        </div>
      </div>

      {minFor ? (
        <div className="overlay" onClick={() => setMinFor(null)}>
          <div className="confirm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2>Atur Batas Minimum</h2>
            <p>{store.productOf(minFor)?.name} — label “Stok Menipis” muncul saat saldo ≤ minimum.</p>
            <form onSubmit={submitMin} noValidate>
              {minError ? (
                <div className="form-error" role="alert">
                  {minError}
                </div>
              ) : null}
              <label className="afield">
                <span>Batas minimum</span>
                <input inputMode="numeric" value={minVal} onChange={(e) => setMinVal(e.target.value)} />
              </label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setMinFor(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
