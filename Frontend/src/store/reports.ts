import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { formatIDR } from "../data/catalog";

/* Util laporan Owner — fungsi murni atas shared store. Uang integer IDR. */

const BULAN: Record<string, number> = {
  jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3,
  mei: 4, jun: 5, juni: 5, jul: 6, juli: 6, agu: 7, agustus: 7, sep: 8, september: 8,
  okt: 9, oktober: 9, nov: 10, november: 10, des: 11, desember: 11,
};

/** Parse "12 Agu 2026" / "10 Okt 2026, 14:23" / "09 Oktober 2026 · 14.24 WIB" → epoch. */
export function parseIdDate(s: string): number | null {
  const m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:[^\d]*(\d{1,2})[:.](\d{2}))?/);
  if (!m) return null;
  const mo = BULAN[m[2].toLowerCase()];
  if (mo === undefined) return null;
  return new Date(Number(m[3]), mo, Number(m[1]), Number(m[4] ?? 0), Number(m[5] ?? 0)).getTime();
}

export type PeriodKey = "semua" | "hari" | "mingguan" | "bulanan" | "tahunan" | "custom";

export function periodRange(key: PeriodKey, customFrom?: string, customTo?: string): { from: number | null; to: number | null; label: string } {
  const now = new Date();
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const endDay = (d: Date) => day(d) + 86400000 - 1;
  switch (key) {
    case "hari":
      return { from: day(now), to: endDay(now), label: "Hari ini" };
    case "mingguan": {
      const monday = new Date(now);
      const offset = (now.getDay() + 6) % 7; // Senin = awal minggu
      monday.setDate(now.getDate() - offset);
      return { from: day(monday), to: endDay(now), label: "Minggu ini" };
    }
    case "bulanan":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), to: endDay(now), label: "Bulan ini" };
    case "tahunan":
      return { from: new Date(now.getFullYear(), 0, 1).getTime(), to: endDay(now), label: `Tahun ${now.getFullYear()}` };
    case "custom": {
      if (!customFrom || !customTo) return { from: null, to: null, label: "Rentang khusus" };
      const [y1, m1, d1] = customFrom.split("-").map(Number);
      const [y2, m2, d2] = customTo.split("-").map(Number);
      return {
        from: new Date(y1, m1 - 1, d1).getTime(),
        to: new Date(y2, m2 - 1, d2, 23, 59, 59, 999).getTime(),
        label: `${customFrom} s.d. ${customTo}`,
      };
    }
    default:
      return { from: null, to: null, label: "Semua waktu" };
  }
}

/** Batas inklusif; tanggal tak terparse hanya lolos bila tanpa batas. */
export function inPeriod(dateStr: string, from: number | null, to: number | null): boolean {
  if (from === null && to === null) return true;
  const t = parseIdDate(dateStr);
  if (t === null) return false;
  return (from === null || t >= from) && (to === null || t <= to);
}

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export const stamp = () => {
  const n = new Date();
  const p = (v: number) => String(v).padStart(2, "0");
  return `${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}-${p(n.getHours())}${p(n.getMinutes())}`;
};

/* ---------------- XLSX ---------------- */

export function exportXlsx(
  title: string,
  meta: Array<[string, string]>,
  head: string[],
  body: Array<Array<string | number>>,
  totalRow?: Array<string | number>,
  fileName?: string,
) {
  const aoa: Array<Array<string | number>> = [
    [title],
    ...meta.map(([k, v]) => [`${k}: ${v}`]),
    [],
    head,
    ...body,
  ];
  if (totalRow) aoa.push(totalRow);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = head.map((_, i) => ({
    wch: Math.max(14, ...aoa.map((r) => String(r[i] ?? "").length + 2)),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  const name = fileName ?? `${title.replace(/[^A-Za-z0-9]+/g, "-")}-${stamp()}.xlsx`;
  XLSX.writeFile(wb, name);
  return name;
}

/* ---------------- PDF (tabel manual, tanpa plugin) ---------------- */

export function exportPdf(
  title: string,
  meta: Array<[string, string]>,
  head: string[],
  body: Array<Array<string | number>>,
  totalRow: Array<string | number> | undefined,
  fileName?: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595;
  const M = 40;
  let y = 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, M, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 140);
  for (const [k, v] of meta) {
    doc.text(`${k}: ${v}`, M, y);
    y += 12;
  }
  y += 6;

  const widths = head.map((_, i) => {
    const all = [head[i], ...body.map((r) => String(r[i] ?? "")), ...(totalRow ? [String(totalRow[i] ?? "")] : [])];
    const maxLen = Math.max(...all.map((s) => s.length));
    return Math.min(150, Math.max(52, maxLen * 5.2));
  });
  const scale = (W - M * 2) / widths.reduce((a, b) => a + b, 0);
  const cols = widths.map((w) => w * scale);

  const row = (cells: Array<string | number>, bold: boolean, fill: boolean) => {
    if (y > 800) {
      doc.addPage();
      y = 48;
    }
    if (fill) {
      doc.setFillColor(238, 240, 253);
      doc.rect(M, y - 10, W - M * 2, 15, "F");
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(8);
    doc.setTextColor(23, 23, 51);
    let x = M;
    cells.forEach((c, i) => {
      doc.text(String(c ?? ""), x + 3, y, { maxWidth: cols[i] - 6 });
      x += cols[i];
    });
    y += 15;
  };

  row(head, true, true);
  for (const r of body) row(r, false, false);
  if (totalRow) {
    y += 2;
    row(totalRow, true, true);
  }

  const name = fileName ?? `${title.replace(/[^A-Za-z0-9]+/g, "-")}-${stamp()}.pdf`;
  doc.save(name);
  return name;
}

export const rp = (v: number) => formatIDR(v);
