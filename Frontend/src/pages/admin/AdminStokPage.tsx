import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, Settings2 } from "lucide-react";
import { adminInventoryApi, ApiError, type AdminStockRow } from "../../lib/api";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { PageHeader, SearchBox, StatusPill } from "../../components/ui";
import AdminPagination from "../../components/AdminPagination";
import "../../styles/pages.css";
import "../../styles/admin.css";

type StockRow = {
  id: string;
  code: string;
  name: string;
  brand: string;
  type: string;
  saldo: number;
  minimum: number;
};

function mapStock(row: AdminStockRow): StockRow {
  return {
    id: String(row.id),
    code: row.kode_barang,
    name: row.nama_barang,
    brand: row.merek ?? "",
    type: row.jenis,
    saldo: Number(row.stok),
    minimum: Number(row.stok_minimum),
  };
}

export default function AdminStokPage() {
  const [stock, setStock] = useState<StockRow[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Aman" | "Menipis">("Semua");
  const [minFor, setMinFor] = useState<StockRow | null>(null);
  const [minVal, setMinVal] = useState("");
  const [minError, setMinError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const debouncedQ = useDebouncedValue(q);

  const loadStock = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStock((await adminInventoryApi.stocks(debouncedQ.trim())).map(mapStock));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Daftar stok gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    void loadStock();
  }, [loadStock]);

  const lowStockCount = stock.filter((row) => row.saldo <= row.minimum).length;
  const rows = useMemo(
    () => stock.filter((row) => {
      const low = row.saldo <= row.minimum;
      return filter === "Semua" || (filter === "Menipis" ? low : !low);
    }),
    [stock, filter],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedQ]);
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const submitMin = async (event: FormEvent) => {
    event.preventDefault();
    const minimum = Number(minVal);
    if (!Number.isInteger(minimum) || minimum < 0 || minimum > 4294967295) {
      setMinError("Batas minimum harus bilangan bulat ≥ 0.");
      return;
    }
    if (!minFor) return;

    setSaving(true);
    setMinError("");
    try {
      const updated = await adminInventoryApi.updateMinimum(Number(minFor.id), minimum);
      setStock((current) => current.map((row) =>
        row.id === minFor.id ? { ...row, saldo: Number(updated.jumlah_stok), minimum: Number(updated.stok_minimum) } : row,
      ));
      setMinFor(null);
    } catch (requestError) {
      setMinError(requestError instanceof ApiError ? requestError.message : "Batas minimum gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN CABANG"
        title="Stok Cabang"
      />

      {error ? (
        <div className="notice" role="alert">
          {error}{" "}
          <button className="btn btn-ghost" type="button" onClick={() => void loadStock()}>
            Coba lagi
          </button>
        </div>
      ) : null}

      <div className="toolbar">
        <SearchBox placeholder="Cari kode, nama, atau merek produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          <select
            className="chip-select"
            aria-label="Filter Status Stok"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "Semua" | "Aman" | "Menipis")}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aman">Aman</option>
            <option value="Menipis">Menipis ({lowStockCount})</option>
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
            {loading ? (
              <tr><td colSpan={6}><div className="empty-note">Memuat stok cabang...</div></td></tr>
            ) : visibleRows.map((row) => {
              const low = row.saldo <= row.minimum;
              const canRequest = ["frame", "lensa"].includes(row.type.toLowerCase());
              return (
                <tr key={row.id}>
                  <td>
                    <div className="tt-num">{row.name}</div>
                    <div className="tt-sub">{row.code} · {row.brand}</div>
                  </td>
                  <td>{row.type}</td>
                  <td className="tt-center tt-money">{row.saldo}</td>
                  <td className="tt-center tt-money">{row.minimum}</td>
                  <td className="tt-center"><StatusPill label={low ? "Stok Menipis" : "Aman"} /></td>
                  <td className="tt-right">
                    <span className="row-actions">
                      <button
                        className="link-action"
                        onClick={() => {
                          setMinFor(row);
                          setMinVal(String(row.minimum));
                          setMinError("");
                        }}
                      >
                        <Settings2 size={14} />
                        Atur Minimum
                      </button>
                      {canRequest ? (
                        <Link className="link-action" to={`/admin/pengajuan?product=${row.id}`}>
                          <FilePlus2 size={14} />
                          Ajukan Stok
                        </Link>
                      ) : (
                        <span className="tt-sub" style={{ marginTop: 0 }}>Pengajuan hanya untuk Frame/Lensa</span>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-note">Tidak ada stok yang cocok dengan filter.</div></td></tr>
            ) : null}
          </tbody>
        </table>
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {minFor ? (
        <div className="overlay" onClick={() => !saving && setMinFor(null)}>
          <div className="confirm" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h2>Atur Batas Minimum</h2>
            <p>{minFor.name} — label “Stok Menipis” muncul saat saldo ≤ minimum.</p>
            <form onSubmit={submitMin} noValidate>
              {minError ? <div className="form-error" role="alert">{minError}</div> : null}
              <label className="afield">
                <span>Batas minimum</span>
                <input inputMode="numeric" value={minVal} onChange={(event) => setMinVal(event.target.value)} />
              </label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setMinFor(null)} disabled={saving}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
