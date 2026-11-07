import { useEffect, useRef, useState } from "react";

/* Bar chart dua seri: periode ini (batang penuh) vs periode sebelumnya (batang muda). */

export type TrendPoint = {
  key: string;
  label: string;
  full: string;
  value: number;
  count: number;
};

type Props = {
  points: TrendPoint[];
  /** Nilai periode sebelumnya, sejajar indeks dengan points. null = tidak ada data. */
  previous: Array<number | null>;
};

/** Batas atas + langkah tick yang "bulat" supaya angka sumbu enak dibaca. */
function niceScale(maxValue: number) {
  if (maxValue <= 0) return { max: 1, step: 1 };
  const raw = maxValue / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { max: Math.ceil(maxValue / step) * step, step };
}

function tickLabel(v: number) {
  if (v === 0) return "0";
  if (v >= 1_000_000) {
    const n = v / 1_000_000;
    return `${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (v >= 1_000) return `${Math.round(v / 1_000)} rb`;
  return String(v);
}

export default function SalesBarChart({ points, previous }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = Math.max(280, Math.round(width));
  const compact = W < 560;
  const H = compact ? 250 : 300;
  const M = { left: compact ? 46 : 56, right: 10, top: 16, bottom: 32 };

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const baseY = M.top + plotH;

  const all = [...points.map((p) => p.value), ...previous.filter((v): v is number => v != null)];
  const peak = Math.max(...all, 0);
  const { max, step } = niceScale(peak);
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));

  const n = points.length;
  const slot = plotW / Math.max(n, 1);
  const gap = compact ? 3 : 4;
  const barW = Math.max(6, Math.min(compact ? 13 : 20, (slot * 0.62 - gap) / 2));
  const yOf = (v: number) => M.top + plotH * (1 - v / max);
  const labelStep = Math.max(1, Math.ceil(n / (compact ? 4 : 8)));

  return (
    <div className="sales-svg-wrap" ref={box}>
      <svg
        className="sales-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Grafik tren penjualan: periode ini dibanding periode sebelumnya"
      >
        <defs>
          <linearGradient id="salesBarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6cb0f5" />
            <stop offset="100%" stopColor="#2f7de1" />
          </linearGradient>
        </defs>

        {/* gridline + angka sumbu Y */}
        {ticks.map((t) => {
          const y = yOf(t);
          return (
            <g key={t}>
              <line x1={M.left} y1={y} x2={W - M.right} y2={y} stroke="#eaf5fe" strokeWidth={1} />
              <text x={M.left - 10} y={y} textAnchor="end" dominantBaseline="middle" className="sales-tick">
                {tickLabel(t)}
              </text>
            </g>
          );
        })}

        <g className="sales-bars">
          {points.map((p, i) => {
            const cx = M.left + slot * (i + 0.5);
            const prev = previous[i];
            const curH = p.value > 0 ? Math.max(baseY - yOf(p.value), 3) : 0;
            const prevH = prev == null ? 0 : prev > 0 ? Math.max(baseY - yOf(prev), 3) : 0;
            return (
              <g key={p.key} className="sales-bar-group">
                <title>{`${p.full} · ${p.count} transaksi · ${tickLabel(p.value)}`}</title>
                {prev != null && (
                  <rect
                    className="sales-bar is-prev"
                    x={cx - barW - gap / 2}
                    y={baseY - prevH}
                    width={barW}
                    height={prevH}
                    rx={4}
                    fill="#cfe4f6"
                  />
                )}
                <rect
                  className="sales-bar"
                  x={cx + gap / 2}
                  y={baseY - curH}
                  width={barW}
                  height={curH}
                  rx={4}
                  fill="url(#salesBarFill)"
                />
                {i % labelStep === 0 && (
                  <text x={cx} y={baseY + 21} textAnchor="middle" className="sales-xlabel">
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
