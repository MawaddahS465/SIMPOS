import { useCallback, useEffect, useRef, useState } from "react";
import MRLogo from "./MRLogo";
import "../styles/ascii-reveal.css";

/**
 * ASCII Reveal — lapisan pembuka (intro) SIMPOS.
 * Merender logo sebagai karakter ASCII di canvas, lalu bertransisi ke dashboard.
 * Tampil sekali per sesi, bisa dilewati, dan hormat pada prefers-reduced-motion.
 */

const SEEN_KEY = "simpos.intro.shown";
const DURATION = 1500; // durasi animasi kanvas (ms)
const HOLD = 160; // jeda singkat sebelum transisi keluar
const EXIT = 380; // durasi fade + blur keluar (ms) — total ≈ 2 detik
const SAFETY = 4000; // pengaman bila ada galat tak terduga
const RAMP = [".", "+", "*", "%", "@", "#"];

type Cell = {
  ch: string;
  x: number; // posisi target (px)
  y: number;
  ox: number; // offset awal untuk fase susun
  oy: number;
  tone: number; // 0..1 kecerahan
};

function introAllowed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(SEEN_KEY) === "1") return false;
  } catch {
    /* sessionStorage bisa diblokir; tetap tampilkan sekali */
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

/** Gambar art (kacamata + wordmark) ke kanvas offscreen untuk disampel jadi grid. */
function drawArt(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.globalAlpha = 0.8;
  const mark = Math.min(W * 0.3, H * 0.46);
  const cx = W / 2;
  const cy = H * 0.33;
  const r = mark * 0.3;
  const gap = mark * 0.33;
  const lw = Math.max(3, mark * 0.2);

  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(cx - gap, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + gap, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // jembatan hidung
  ctx.beginPath();
  ctx.moveTo(cx - gap + r * 0.86, cy - r * 0.16);
  ctx.quadraticCurveTo(cx, cy - r * 0.62, cx + gap - r * 0.86, cy - r * 0.16);
  ctx.stroke();
  // tangkai kiri/kanan
  ctx.beginPath();
  ctx.moveTo(cx - gap - r * 0.94, cy - r * 0.36);
  ctx.lineTo(cx - gap - r * 1.7, cy - r * 0.72);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + gap + r * 0.94, cy - r * 0.36);
  ctx.lineTo(cx + gap + r * 1.7, cy - r * 0.72);
  ctx.stroke();

  // wordmark
  const fs = Math.min(W * 0.17, H * 0.22);
  ctx.font = `800 ${fs}px "Plus Jakarta Sans", "Inter", system-ui, sans-serif`;
  ctx.fillText("SIMPOS", cx, H * 0.72);

  // garis aksen tipis
  ctx.lineWidth = Math.max(1.5, fs * 0.045);
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.17, H * 0.87);
  ctx.lineTo(cx + W * 0.17, H * 0.87);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function buildCells(W: number, H: number, cols: number, rows: number): Cell[] {
  const art = document.createElement("canvas");
  art.width = cols;
  art.height = rows;
  const actx = art.getContext("2d", { willReadFrequently: true });
  if (!actx) return [];
  actx.drawImage(
    (() => {
      const big = document.createElement("canvas");
      big.width = cols * 8;
      big.height = rows * 8;
      const bctx = big.getContext("2d");
      if (bctx) drawArt(bctx, big.width, big.height);
      return big;
    })(),
    0,
    0,
    cols,
    rows,
  );

  let data: Uint8ClampedArray;
  try {
    data = actx.getImageData(0, 0, cols, rows).data;
  } catch {
    return [];
  }

  const cellW = W / cols;
  const cellH = H / rows;
  const cells: Cell[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const a = data[i + 3] / 255;
      if (a < 0.1) continue;
      const tone = Math.min(1, Math.pow(a, 1.25) * 1.35);
      const idx = Math.min(RAMP.length - 1, Math.floor(tone * RAMP.length));
      // sebar awal deterministik supaya sel menyusun diri secara teratur
      const seed = Math.sin((x * 12.9898 + y * 78.233) * 43758.5453);
      const spread = 0.42 + (seed - Math.floor(seed)) * 0.34;
      cells.push({
        ch: RAMP[idx],
        x: (x + 0.5) * cellW,
        y: (y + 0.5) * cellH,
        ox: (Math.sin(x * 3.1 + y * 1.7) * spread * W) / 2,
        oy: (Math.cos(x * 1.3 + y * 2.9) * spread * H) / 2,
        tone,
      });
    }
  }
  return cells;
}

export default function AsciiReveal() {
  const [phase, setPhase] = useState<"idle" | "run" | "exit" | "done">(() => (introAllowed() ? "idle" : "done"));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    document.body.classList.remove("intro-active");
    setPhase((p) => (p === "done" ? p : "exit"));
    window.setTimeout(() => setPhase("done"), EXIT);
  }, []);

  // Tandai sesi + kunci animasi dashboard agar muncul setelah overlay hilang.
  useEffect(() => {
    if (phase !== "idle") return;
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* abaikan */
    }
    setPhase("run");
  }, [phase]);

  useEffect(() => {
    if (phase === "done") return;
    document.body.classList.add("intro-active");
    return () => document.body.classList.remove("intro-active");
  }, [phase]);

  // Kanvas ASCII.
  useEffect(() => {
    if (phase !== "run") return;
    const canvas = canvasRef.current;
    if (!canvas) {
      finish();
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      finish();
      return;
    }

    let raf = 0;
    let cells: Cell[] = [];
    let W = 0;
    let H = 0;
    let cellH = 12;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);

    try {
      const vw = Math.max(320, Math.min(window.innerWidth * 0.9, 1040));
      const vh = Math.max(200, Math.min(window.innerHeight * 0.5, 500));
      const cols = vw < 560 ? 64 : vw < 860 ? 82 : 100;
      const rows = Math.max(20, Math.round(cols * 0.42));
      cellH = Math.min(18, Math.max(9, vh / rows));
      W = cols * (cellH * 0.62);
      H = rows * cellH;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${Math.round(W)}px`;
      canvas.style.height = `${Math.round(H)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = buildCells(W, H, cols, rows);
    } catch {
      finish();
      return;
    }

    if (cells.length === 0) {
      finish();
      return;
    }

    const font = `700 ${Math.max(8, cellH * 0.92)}px ui-monospace, "SFMono-Regular", "Menlo", monospace`;
    const start = performance.now();

    const paint = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const assemble = Math.min(1, t / 0.62);
      const ease = 1 - Math.pow(1 - assemble, 3);
      const wave = Math.max(0, (t - 0.5) / 0.5);

      for (const c of cells) {
        const px = c.x + c.ox * (1 - ease);
        const py = c.y + c.oy * (1 - ease);
        const alpha = ease;
        // denyut cahaya menyeberang grid setelah tersusun
        const pulse = wave > 0 ? 0.72 + 0.28 * Math.sin(c.x * 0.06 + c.y * 0.09 - wave * 7) : 1;
        const light = Math.min(1, c.tone * pulse);
        // Palet mengikuti logo baru: navy #1D2184 dengan tepi biru muda.
        const g = Math.round(33 + 62 * (1 - light));
        const b = Math.round(132 + 70 * (1 - light));
        const r = Math.round(29 + 46 * (1 - light));
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * (0.72 + 0.28 * light)})`;
        ctx.fillText(c.ch, px, py);
      }
    };

    const tick = (now: number) => {
      const t = (now - start) / DURATION;
      if (t >= 1) {
        paint(1);
        window.setTimeout(finish, HOLD);
        return; // hentikan loop; tidak ada rAF tersisa
      }
      paint(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [phase, finish]);

  // Lewati: klik, Esc, Enter, Space, atau tombol.
  useEffect(() => {
    if (phase !== "run") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
    };
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", onKey);
    const safety = window.setTimeout(finish, SAFETY);
    return () => {
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(safety);
    };
  }, [phase, finish]);

  if (phase === "done") return null;

  return (
    <div className={`ascii-reveal ${phase === "exit" ? "is-exit" : ""}`} aria-hidden="true">
      <div className="ascii-reveal-glow" />
      <div className="ascii-reveal-stage">
        <canvas ref={canvasRef} className="ascii-reveal-canvas" />
        <div className="ascii-reveal-brand">
          <MRLogo size={44} className="ascii-reveal-mark" />
          <div>
            <b>SIMPOS</b>
            <span>Optik Mekar Jaya</span>
          </div>
        </div>
      </div>
      <button type="button" className="ascii-reveal-skip" onClick={finish}>
        Lewati intro
      </button>
    </div>
  );
}
