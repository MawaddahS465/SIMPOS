import { useState } from "react";
import { Banknote, ChevronRight, CreditCard, Download, QrCode, Wallet } from "lucide-react";
import { PAYMENTS, type PaymentMethod } from "../data/mock";
import { exportXlsx, stamp } from "../store/reports";
import { Chip, PageHeader, SearchBox, StatCard, StatusPill, formatIDR } from "../components/ui";
import "../styles/pages.css";

const FILTERS = ["Semua", "Lunas", "Pending", "Dibatalkan"] as const;

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  Tunai: Banknote,
  "Transfer Bank": Wallet,
  "Kartu Debit/Kredit": CreditCard,
  QRIS: QrCode,
};

export default function PembayaranPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Semua");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(false);

  const rows = PAYMENTS.filter((p) => (filter === "Semua" ? true : p.status === filter)).filter((p) =>
    `${p.no} ${p.customer} ${p.method}`.toLowerCase().includes(query.toLowerCase()),
  );

  const received = PAYMENTS.filter((p) => p.status === "Lunas").reduce((s, p) => s + p.amount, 0);
  const pending = PAYMENTS.filter((p) => p.status === "Pending").reduce((s, p) => s + p.amount, 0);

  const doExport = () => {
    if (rows.length === 0) {
      setNotice(true);
      return;
    }
    exportXlsx(
      "Laporan Pembayaran — Cabang Padang",
      [
        ["Status", filter],
        ["Jumlah baris", String(rows.length)],
      ],
      ["No. Pembayaran", "Tanggal", "Pelanggan", "Metode", "Jumlah (Rp)", "Status"],
      rows.map((p) => [p.no, p.date, p.customer, p.method, p.amount, p.status]),
      ["TOTAL", "", "", "", rows.reduce((s, p) => s + p.amount, 0), ""],
      `Pembayaran-Cabang-Padang-${stamp()}.xlsx`,
    );
    setNotice(true);
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <b>Kasir</b> › Pembayaran
          </>
        }
        overline="KEUANGAN CABANG"
        title="Pembayaran"
        desc="Rekap pembayaran transaksi di Cabang Padang."
        actions={
          <button className="btn btn-ghost" onClick={doExport}>
            <Download size={16} />
            Ekspor XLSX
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Total diterima" value={formatIDR(received)} caption="Pembayaran berstatus lunas" icon={<Banknote size={22} />} tone="green" />
        <StatCard label="Menunggu pembayaran" value={formatIDR(pending)} caption="Belum diselesaikan" icon={<Wallet size={22} />} tone="amber" />
        <StatCard label="Jumlah transaksi" value={String(PAYMENTS.length)} caption="Pada periode ini" icon={<CreditCard size={22} />} tone="violet" />
      </div>

      {notice ? (
        <div className={rows.length === 0 ? "notice" : "notice notice-ok"} role="status">
          <Download size={16} />
          {rows.length === 0
            ? "Tidak ada baris untuk diekspor pada filter ini."
            : `Ekspor XLSX diunduh (${rows.length} baris sesuai filter).`}
        </div>
      ) : null}

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Daftar Pembayaran</h2>
            <div className="section-desc">Riwayat pembayaran terbaru</div>
          </div>
          <div className="section-action">
            <select className="select-pill" aria-label="Metode" defaultValue="all">
              <option value="all">Semua Metode</option>
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer Bank</option>
              <option value="kartu">Kartu</option>
              <option value="qris">QRIS</option>
            </select>
          </div>
        </div>

        <div className="toolbar">
          <SearchBox placeholder="Cari nomor pembayaran atau nama pelanggan..." value={query} onChange={setQuery} />
          <div className="toolbar-chips">
            {FILTERS.map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="tt">
            <thead>
              <tr>
                <th>NO. PEMBAYARAN</th>
                <th>TANGGAL</th>
                <th>PELANGGAN</th>
                <th>METODE</th>
                <th className="tt-center">JUMLAH</th>
                <th className="tt-center">STATUS</th>
                <th className="tt-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const Icon = METHOD_ICON[p.method];
                return (
                  <tr key={p.no}>
                    <td>
                      <div className="tt-num">{p.no}</div>
                    </td>
                    <td>{p.date}</td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        {p.customer}
                      </div>
                    </td>
                    <td>
                      <span className="type-chip">
                        <Icon size={14} />
                        {p.method}
                      </span>
                    </td>
                    <td className="tt-center tt-money">{formatIDR(p.amount)}</td>
                    <td className="tt-center">
                      <StatusPill label={p.status} />
                    </td>
                    <td className="tt-right">
                      <span className="link-action">
                        Lihat Detail
                        <ChevronRight size={15} />
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-note">Tidak ada pembayaran yang cocok dengan filter.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-foot">
            <span className="foot-note">
              Menampilkan {rows.length} dari {PAYMENTS.length} pembayaran
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
