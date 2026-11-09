import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, ChevronRight, Clock, History, Info, X } from "lucide-react";
import { useSharedStore } from "../../store/sharedStore";
import { requestState, requestStateLabel } from "../../store/requestStatus";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const BULAN: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 2, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
};

function parseAt(at: string): number {
  const m = at.match(/(\d+)\s+(\w+)\s+(\d{4}),?\s+(\d+)[:.](\d+)/);
  if (!m) return 0;
  return new Date(Number(m[3]), BULAN[m[2]] ?? 0, Number(m[1]), Number(m[4]), Number(m[5])).getTime();
}

const PAGE = 10;

export default function OwnerMutasiPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("all");
  const [arah, setArah] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
  const [sumber, setSumber] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scopedMutations = useMemo(
    () =>
      [...store.mutations]
        .sort((a, b) => parseAt(b.at) - parseAt(a.at))
        .filter((m) => (loc === "all" ? true : m.branchId === loc)),
    [store.mutations, loc],
  );

  const totalMasuk = useMemo(
    () => scopedMutations.filter((m) => m.arah === "IN").reduce((acc, m) => acc + m.qty, 0),
    [scopedMutations],
  );
  const totalKeluar = useMemo(
    () => scopedMutations.filter((m) => m.arah === "OUT").reduce((acc, m) => acc + Math.abs(m.qty), 0),
    [scopedMutations],
  );

  const rows = useMemo(
    () =>
      scopedMutations
        .filter((m) => (arah === "Semua" ? true : m.arah === (arah === "Masuk" ? "IN" : "OUT")))
        .filter((m) => (sumber === "all" ? true : m.sumber === sumber))
        .filter((m) => {
          const p = store.productOf(m.productId);
          return `${m.id} ${m.ref} ${m.sumber} ${p?.name ?? ""} ${p?.code ?? ""} ${m.actor}`
            .toLowerCase()
            .includes(q.toLowerCase());
        }),
    [scopedMutations, arah, sumber, q, store],
  );

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, pages);
  const view = rows.slice((safePage - 1) * PAGE, safePage * PAGE);

  const directMove = selectedId ? store.mutations.find((m) => m.id === selectedId) : undefined;

  // Telusur dua arah: Pengajuan <-> Alokasi <-> Penerimaan <-> Mutasi
  const initialReceipt =
    directMove?.sumber === "Penerimaan"
      ? store.receipts.find((r) => r.id === (directMove.traceId ?? directMove.ref))
      : undefined;
  const resolvedAllocId = initialReceipt?.distributionId;
  const initialAlloc = resolvedAllocId ? store.distributions.find((d) => d.id === resolvedAllocId) : undefined;
  const resolvedRequestId = initialAlloc?.requestId;

  const traceReq = resolvedRequestId ? store.requests.find((r) => r.id === resolvedRequestId) : undefined;
  const traceReqAlloc = traceReq ? store.allocatedForRequest(traceReq.id, traceReq.productId) : 0;
  const traceReqReceived = traceReq ? store.receivedForRequest(traceReq.id, traceReq.productId) : 0;
  const traceAllocs = directMove
    ? store.distributions.filter(
        (d) =>
          (resolvedAllocId && d.id === resolvedAllocId) ||
          (resolvedRequestId && d.requestId === resolvedRequestId),
      )
    : [];
  const traceReceipts = directMove
    ? store.receipts.filter(
        (r) =>
          (initialReceipt && r.id === initialReceipt.id) ||
          traceAllocs.some((d) => d.id === r.distributionId && r.productId === directMove.productId),
      )
    : [];
  const traceMoves = directMove
    ? store.mutations.filter(
        (m) =>
          m.id === directMove.id ||
          traceReceipts.some((r) => r.id === (m.traceId ?? m.ref) && m.productId === directMove.productId),
      )
    : [];

  const isDirectPhysical =
    Boolean(directMove) &&
    directMove?.sumber !== "Penerimaan" &&
    !traceReq &&
    traceAllocs.length === 0 &&
    traceReceipts.length === 0;

  const traceProduct = directMove ? store.productOf(directMove.productId) : undefined;
  const traceBranchName = directMove
    ? store.branches.find((b) => b.id === directMove.branchId)?.name ?? directMove.branchId
    : "";

  return (
    <div className="page">
      <PageHeader
        overline="PENGAWASAN — RIWAYAT MUTASI"
        title="Riwayat Mutasi"
        desc="Pantau seluruh pergerakan stok masuk dan keluar beserta jejak alokasi di semua cabang."
      />

      <div className="stat-row">
        <StatCard
          label="Total Barang Masuk"
          value={`+${totalMasuk} unit`}
          caption="Penerimaan distribusi & saldo awal"
          icon={<ArrowDownLeft size={22} />}
          tone="green"
        />
        <StatCard
          label="Total Barang Keluar"
          value={`${totalKeluar} unit`}
          caption="Penjualan kasir di cabang"
          icon={<ArrowUpRight size={22} />}
          tone="amber"
        />
        <StatCard
          label="Total Catatan Mutasi"
          value={String(scopedMutations.length)}
          caption="Riwayat perubahan stok fisik"
          icon={<History size={22} />}
          tone="violet"
        />
      </div>

      <div className="toolbar">
        <SearchBox
          placeholder="Cari ID mutasi, nomor referensi, kode, atau nama produk..."
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
        />
        <select
          className="select-pill"
          aria-label="Filter Jenis Mutasi"
          value={arah}
          onChange={(e) => {
            setArah(e.target.value as "Semua" | "Masuk" | "Keluar");
            setPage(1);
          }}
        >
          <option value="Semua">Semua Jenis</option>
          <option value="Masuk">Masuk</option>
          <option value="Keluar">Keluar</option>
        </select>
        <select
          className="select-pill"
          aria-label="Sumber"
          value={sumber}
          onChange={(e) => {
            setSumber(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Semua Sumber</option>
          <option value="Penerimaan">Penerimaan</option>
          <option value="Penjualan">Penjualan</option>
          <option value="Pembatalan">Pembatalan</option>
          <option value="Saldo Awal">Saldo Awal</option>
          <option value="Pengambilan PO">Pengambilan PO</option>
        </select>
        <select
          className="select-pill"
          aria-label="Lokasi"
          value={loc}
          onChange={(e) => {
            setLoc(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Semua Lokasi</option>
          {store.branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>WAKTU / ID</th>
              <th>PRODUK</th>
              <th>CABANG &amp; AKTOR</th>
              <th className="tt-center">JENIS</th>
              <th>SUMBER</th>
              <th className="tt-right">MUTASI STOK</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {view.map((m) => {
              const p = store.productOf(m.productId);
              const branchName = store.branches.find((b) => b.id === m.branchId)?.name ?? m.branchId;
              return (
                <tr
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div className="tt-num">{m.id}</div>
                    <div className="tt-sub">{m.at}</div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {p?.name ?? m.productId}
                    </div>
                    <div className="tt-sub">{p?.code} · {p?.type}</div>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div className="tt-num" style={{ fontSize: 13 }}>{branchName}</div>
                    <div className="tt-sub">{m.actor}</div>
                  </td>
                  <td className="tt-center" style={{ whiteSpace: "nowrap" }}>
                    <StatusPill label={m.arah === "IN" ? "Masuk" : "Keluar"} />
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div className="tt-num" style={{ fontSize: 13 }}>{m.sumber}</div>
                    <div className="tt-sub">{m.ref}</div>
                  </td>
                  <td className="tt-right" style={{ whiteSpace: "nowrap" }}>
                    <div
                      className="tt-money"
                      style={{ color: m.arah === "IN" ? "var(--ok-ink)" : "var(--danger-ink)" }}
                    >
                      {m.qty > 0 ? `+${m.qty} unit` : `${m.qty} unit`}
                    </div>
                    <div className="tt-sub">
                      Saldo: {m.sebelum} → <b style={{ color: "var(--ink)" }}>{m.sesudah}</b>
                    </div>
                  </td>
                  <td className="tt-right">
                    <button
                      type="button"
                      className="link-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(m.id);
                      }}
                    >
                      Detail
                      <ChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {view.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-note">Tidak ada mutasi barang yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Menampilkan {view.length} dari {rows.length} mutasi stok · Halaman {safePage} dari {pages}
          </span>
          <div className="foot-actions">
            <button
              className="btn btn-ghost btn-sm"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              Sebelumnya
            </button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={safePage >= pages}
              onClick={() => setPage(safePage + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {directMove ? (
        <div className="overlay" onClick={() => setSelectedId(null)}>
          <div className="drawer" key={directMove.id} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>Detail &amp; Jejak Mutasi</h2>
                <div className="section-desc">{directMove.id} · {directMove.at}</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setSelectedId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="trace-summary-card">
              <div className="trace-summary-top">
                <div>
                  <b>{traceProduct?.name ?? directMove.productId}</b>
                  <span>
                    {traceProduct?.code ?? directMove.productId} · {traceBranchName}
                  </span>
                </div>
                <StatusPill label={directMove.arah === "IN" ? "Masuk" : "Keluar"} />
              </div>
              <div className="trace-summary-meta">
                <div className="trace-meta-item">
                  <span>Sumber &amp; Referensi</span>
                  <b>{directMove.sumber} · {directMove.ref}</b>
                </div>
                <div className="trace-meta-item">
                  <span>Perubahan</span>
                  <b>{directMove.qty > 0 ? `+${directMove.qty} unit` : `${directMove.qty} unit`}</b>
                </div>
                <div className="trace-meta-item">
                  <span>Saldo Stok</span>
                  <b>{directMove.sebelum} → {directMove.sesudah} unit</b>
                </div>
              </div>
            </div>

            <div className="mini-label">JEJAK RANTAI KEJADIAN</div>

            {isDirectPhysical && directMove ? (
              <>
                <div className="trace-chain">
                  <div className="trace-step is-done">
                    <span className="trace-dot">
                      <Check size={14} strokeWidth={2.6} />
                    </span>
                    <div className="trace-card">
                      <div className="trace-card-body">
                        <div className="trace-card-stage">SUMBER KEJADIAN LANGSUNG</div>
                        <b>
                          {directMove.sumber} · {directMove.ref}
                        </b>
                        <span>
                          {directMove.at} · oleh {directMove.actor}
                        </span>
                      </div>
                      <StatusPill label={directMove.arah === "IN" ? "Masuk" : "Keluar"} dot={false} />
                    </div>
                  </div>

                  <div className="trace-step is-done">
                    <span className="trace-dot">
                      <Check size={14} strokeWidth={2.6} />
                    </span>
                    <div className="trace-card">
                      <div className="trace-card-body">
                        <div className="trace-card-stage">MUTASI STOK FISIK</div>
                        <b>Mutasi {directMove.id}</b>
                        <span>
                          Saldo {directMove.sebelum} → <b>{directMove.sesudah} unit</b> ({traceBranchName})
                        </span>
                      </div>
                      <span className="trace-qty-badge">
                        {directMove.qty > 0 ? `+${directMove.qty}` : directMove.qty} unit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="notice">
                  <Info size={16} />
                  <span>
                    Kejadian <b>{directMove.sumber}</b> mengubah stok fisik secara langsung tanpa melalui rantai
                    pengajuan &amp; alokasi distribusi.
                  </span>
                </div>
              </>
            ) : (
              <div className="trace-chain">
                {/* Tahap 1: Pengajuan */}
                <div className={`trace-step ${traceReq ? "is-done" : "is-pending"}`}>
                  <span className="trace-dot">
                    {traceReq ? <Check size={14} strokeWidth={2.6} /> : "1"}
                  </span>
                  <div className="trace-card">
                    <div className="trace-card-body">
                      <div className="trace-card-stage">TAHAP 1 · PENGAJUAN CABANG</div>
                      {traceReq ? (
                        <>
                          <b>Pengajuan {traceReq.id}</b>
                          <span>
                            {traceReq.at} · {traceReq.actor} · minta {traceReq.qty} unit
                          </span>
                        </>
                      ) : (
                        <>
                          <b>Tanpa Pengajuan Terkait</b>
                          <span>Alokasi dibuat langsung dari pusat tanpa referensi pengajuan cabang</span>
                        </>
                      )}
                    </div>
                    {traceReq ? (
                      <StatusPill
                        label={requestStateLabel(
                          requestState(traceReq, traceReq.qty, traceReqAlloc, traceReqReceived),
                        )}
                        dot={false}
                      />
                    ) : null}
                  </div>
                </div>

                {/* Tahap 2: Alokasi */}
                <div className={`trace-step ${traceAllocs.length > 0 ? "is-done" : "is-pending"}`}>
                  <span className="trace-dot">
                    {traceAllocs.length > 0 ? <Check size={14} strokeWidth={2.6} /> : <Clock size={14} />}
                  </span>
                  <div className="trace-card">
                    <div className="trace-card-body">
                      <div className="trace-card-stage">TAHAP 2 · ALOKASI DISTRIBUSI</div>
                      {traceAllocs.length > 0 ? (
                        traceAllocs.map((d) => {
                          const line = d.lines.find((l) => l.productId === directMove.productId);
                          return (
                            <div key={d.id} style={{ marginTop: 2 }}>
                              <b>Alokasi {d.id}</b>
                              <span>
                                {d.date} · {d.actor ?? "Sistem"} · {line?.qtyAlokasi ?? 0} unit · {d.status}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <b>Belum Ada Alokasi</b>
                          <span>Menunggu penentuan alokasi distribusi dari Pemilik</span>
                        </>
                      )}
                    </div>
                    {traceAllocs.length > 0 ? (
                      <span className="trace-qty-badge">
                        {traceAllocs.reduce(
                          (acc, d) => acc + (d.lines.find((l) => l.productId === directMove.productId)?.qtyAlokasi ?? 0),
                          0,
                        )}{" "}
                        unit
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Tahap 3: Penerimaan */}
                <div className={`trace-step ${traceReceipts.length > 0 ? "is-done" : "is-pending"}`}>
                  <span className="trace-dot">
                    {traceReceipts.length > 0 ? <Check size={14} strokeWidth={2.6} /> : <Clock size={14} />}
                  </span>
                  <div className="trace-card">
                    <div className="trace-card-body">
                      <div className="trace-card-stage">TAHAP 3 · PENERIMAAN CABANG</div>
                      {traceReceipts.length > 0 ? (
                        traceReceipts.map((r) => (
                          <div key={r.id} style={{ marginTop: 2 }}>
                            <b>Penerimaan {r.id}</b>
                            <span>
                              {r.at} · {r.actor} · +{r.qty} unit
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          <b>Menunggu Penerimaan Fisik</b>
                          <span>Barang belum dikonfirmasi diterima oleh Admin Cabang</span>
                        </>
                      )}
                    </div>
                    {traceReceipts.length > 0 ? (
                      <span className="trace-qty-badge">
                        +{traceReceipts.reduce((acc, r) => acc + r.qty, 0)} unit
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Tahap 4: Mutasi Fisik */}
                <div className={`trace-step ${traceMoves.length > 0 ? "is-done" : "is-pending"}`}>
                  <span className="trace-dot">
                    {traceMoves.length > 0 ? <Check size={14} strokeWidth={2.6} /> : "4"}
                  </span>
                  <div className="trace-card">
                    <div className="trace-card-body">
                      <div className="trace-card-stage">TAHAP 4 · MUTASI STOK FISIK</div>
                      {traceMoves.length > 0 ? (
                        traceMoves.slice(0, 5).map((m) => (
                          <div key={m.id} style={{ marginTop: 2 }}>
                            <b>Mutasi {m.id}</b>
                            <span>
                              {m.at} · {m.sumber} · saldo {m.sebelum} → {m.sesudah}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          <b>Belum Ada Mutasi Fisik</b>
                          <span>Stok fisik belum berubah sebelum penerimaan dikonfirmasi</span>
                        </>
                      )}
                    </div>
                    {traceMoves.length > 0 ? (
                      <span className="trace-qty-badge">
                        {traceMoves[0].qty > 0 ? `+${traceMoves[0].qty}` : traceMoves[0].qty} unit
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setSelectedId(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
