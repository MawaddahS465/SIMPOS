import "../styles/dashboard.css";

type Props = {
  title: string;
  note?: string;
};

/**
 * Honest placeholder for routes that are scheduled for a later phase.
 * Keeps navigation alive (no dead links) while Login + Dashboard are locked.
 */
export default function PlaceholderPage({ title, note }: Props) {
  return (
    <div className="dash">
      <section className="section-head">
        <h2>{title}</h2>
        <p>{note ?? "Halaman ini akan diimplementasikan pada fase berikutnya."}</p>
      </section>
      <section
        className="history-strip"
        style={{ display: "block", color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7 }}
      >
        <b style={{ color: "var(--ink)", fontWeight: 800 }}>Belum diimplementasikan.</b>
        <br />
        Fokus saat ini: mengunci tampilan <b>Login</b> dan <b>Dashboard</b> agar sesuai referensi. Rute ini
        menyusul sesuai PRD Kasir.
      </section>
    </div>
  );
}
