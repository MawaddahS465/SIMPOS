import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function AdminMutasiPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [arah, setArah] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
  const [sumber, setSumber] = useState("all");

  const rows = useMemo(
    () =>
      store.mutations
        .filter((m) => (arah === "Semua" ? true : m.arah === (arah === "Masuk" ? "IN" : "OUT")))
        .filter((m) => (sumber === "all" ? true : m.sumber === sumber))
        .filter((m) => {
          const p = store.productOf(m.productId);
          return `${m.id} ${m.ref} ${p?.code ?? ""} ${p?.name ?? ""}`.toLowerCase().includes(q.toLowerCase());
        }),
    [store, q, arah, sumber],
  );

  const masuk = store.mutations.filter((m) => m.arah === "IN").reduce((a, m) => a + m.qty, 0);
  const keluar = store.mutations.filter((m) => m.arah === "OUT").reduce((a, m) => a + m.qty, 0);

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN — MUTASI"
        title="Riwayat Mutasi"
        desc={`Jejak perubahan stok masuk dan keluar di ${DEMO_ADMIN.branch}.`}
      />

      <div className="stat-row">
        <StatCard
          label="Total Barang Masuk"
          value={`+${masuk}`}
          caption="Penerimaan pusat & saldo awal"
          icon={<ArrowDownLeft size={22} />}
          tone="green"
        />
        <StatCard
          label="Total Barang Keluar"
          value={String(keluar)}
          caption="Penjualan kasir cabang"
          icon={<ArrowUpRight size={22} />}
          tone="amber"
        />
        <StatCard
          label="Total Catatan Mutasi"
          value={String(store.mutations.length)}
          caption={`Seluruh aktivitas stok ${DEMO_ADMIN.branch}`}
          icon={<History size={22} />}
          tone="violet"
        />
      </div>

      <div className="toolbar">
        <SearchBox placeholder="Cari ID mutasi, nomor referensi, kode, atau nama produk..." value={q} onChange={setQ} />
        <select
          className="select-pill"
          aria-label="Filter Jenis Mutasi"
          value={arah}
          onChange={(e) => setArah(e.target.value as "Semua" | "Masuk" | "Keluar")}
        >
          <option value="Semua">Semua Jenis</option>
          <option value="Masuk">Masuk</option>
          <option value="Keluar">Keluar</option>
        </select>
        <select className="select-pill" aria-label="Sumber" value={sumber} onChange={(e) => setSumber(e.target.value)}>
          <option value="all">Semua Sumber</option>
          <option value="Penerimaan">Penerimaan</option>
          <option value="Penjualan">Penjualan</option>
          <option value="Pembatalan">Pembatalan</option>
          <option value="Saldo Awal">Saldo Awal</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>WAKTU / ID</th>
              <th>PRODUK</th>
              <th className="tt-center">JENIS</th>
              <th>SUMBER</th>
              <th className="tt-right">MUTASI STOK</th>
              <th>PETUGAS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const p = store.productOf(m.productId);
              return (
                <tr key={m.id}>
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
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div className="tt-num" style={{ fontSize: 13 }}>{m.actor}</div>
                    <div className="tt-sub">Cabang Padang</div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-note">Tidak ada mutasi yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Menampilkan {rows.length} dari {store.mutations.length} mutasi stok
          </span>
        </div>
      </div>
    </div>
  );
}
