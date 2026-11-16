import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

type DateRangePickerProps = {
  fromDate: string;
  toDate: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
};

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function parseYmd(value: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function formatShortYmd(ymd: string): string {
  const p = parseYmd(ymd);
  if (!p) return ymd;
  return `${pad2(p.day)} ${MONTHS_SHORT[p.month] ?? ""} ${p.year}`;
}

function formatRangeButton(fromDate: string, toDate: string, placeholder: string): string {
  if (!fromDate && !toDate) return placeholder;
  if (fromDate && toDate) {
    if (fromDate === toDate) return formatShortYmd(fromDate);
    const a = parseYmd(fromDate);
    const b = parseYmd(toDate);
    if (a && b && a.year === b.year) {
      return `${pad2(a.day)} ${MONTHS_SHORT[a.month]} – ${pad2(b.day)} ${MONTHS_SHORT[b.month]} ${b.year}`;
    }
    return `${formatShortYmd(fromDate)} – ${formatShortYmd(toDate)}`;
  }
  return fromDate ? `Mulai ${formatShortYmd(fromDate)}` : `Hingga ${formatShortYmd(toDate)}`;
}

/** Pemilih rentang tanggal satu kalender dengan klik awal lalu akhir. */
export default function DateRangePicker({
  fromDate,
  toDate,
  onChange,
  placeholder = "Semua waktu",
}: DateRangePickerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const todayYmd = toYmd(now.getFullYear(), now.getMonth(), now.getDate());

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseYmd(toDate || fromDate)?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseYmd(toDate || fromDate)?.month ?? now.getMonth());
  const [pickingEnd, setPickingEnd] = useState(false);
  const [anchorDate, setAnchorDate] = useState("");
  const [hoverDate, setHoverDate] = useState("");

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
        setPickingEnd(false);
        setHoverDate("");
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setPickingEnd(false);
        setHoverDate("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleOpen() {
    if (open) {
      setOpen(false);
      setPickingEnd(false);
      setHoverDate("");
      return;
    }
    const focus = parseYmd(toDate || fromDate);
    if (focus) {
      setViewYear(focus.year);
      setViewMonth(focus.month);
    }
    setPickingEnd(false);
    setAnchorDate("");
    setHoverDate("");
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function handleDayClick(ymd: string) {
    if (!pickingEnd) {
      setAnchorDate(ymd);
      setPickingEnd(true);
      setHoverDate("");
      onChange(ymd, ymd);
      return;
    }
    const start = anchorDate <= ymd ? anchorDate : ymd;
    const end = anchorDate <= ymd ? ymd : anchorDate;
    onChange(start, end);
    setPickingEnd(false);
    setAnchorDate("");
    setHoverDate("");
    setOpen(false);
  }

  function handleReset() {
    onChange("", "");
    setPickingEnd(false);
    setAnchorDate("");
    setHoverDate("");
    setOpen(false);
  }

  const firstOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const minYear = Math.min(now.getFullYear() - 5, viewYear);
  const maxYear = Math.max(now.getFullYear() + 2, viewYear);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  let activeStart = fromDate;
  let activeEnd = toDate;
  if (pickingEnd && anchorDate) {
    const target = hoverDate || anchorDate;
    activeStart = anchorDate <= target ? anchorDate : target;
    activeEnd = anchorDate <= target ? target : anchorDate;
  }

  const hasValue = Boolean(fromDate || toDate);

  return (
    <div className="drp-wrap" ref={wrapRef}>
      <div className={`drp-control${open ? " is-open" : ""}`}>
        <button
          type="button"
          className="drp-trigger"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Pilih rentang tanggal"
          onClick={toggleOpen}
        >
          <CalendarDays size={16} className="drp-icon" />
          <span className={`drp-label${hasValue ? " has-value" : ""}`}>
            {formatRangeButton(fromDate, toDate, placeholder)}
          </span>
          <ChevronDown size={14} className={`drp-caret${open ? " is-open" : ""}`} />
        </button>
        {hasValue ? (
          <button
            type="button"
            className="drp-clear"
            onClick={handleReset}
            title="Tampilkan semua waktu"
            aria-label="Reset rentang tanggal"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="drp-popover"
          role="dialog"
          aria-label="Kalender rentang tanggal"
          onMouseLeave={() => setHoverDate("")}
        >
          <div className="drp-head">
            <button
              type="button"
              className="drp-nav"
              onClick={() => shiftMonth(-1)}
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="drp-ym">
              <select
                aria-label="Pilih bulan"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {MONTHS_FULL.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Pilih tahun"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="drp-nav"
              onClick={() => shiftMonth(1)}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="drp-hint">
            {pickingEnd
              ? `Mulai ${formatShortYmd(anchorDate)} — klik tanggal selesai`
              : hasValue
                ? `${formatShortYmd(fromDate || toDate)} – ${formatShortYmd(toDate || fromDate)}`
                : "Klik tanggal mulai, lalu klik tanggal selesai"}
          </div>

          <div className="drp-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="drp-grid">
            {Array.from({ length: firstOffset }, (_, i) => (
              <span key={`empty-${i}`} className="drp-empty" aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const ymd = toYmd(viewYear, viewMonth, day);
              const isStart = Boolean(activeStart && ymd === activeStart);
              const isEnd = Boolean(activeEnd && ymd === activeEnd);
              const isInRange = Boolean(activeStart && activeEnd && ymd > activeStart && ymd < activeEnd);
              const isSingle = isStart && isEnd;
              const isToday = ymd === todayYmd;

              const classes = [
                "drp-day",
                isStart ? "is-start" : "",
                isEnd ? "is-end" : "",
                isSingle ? "is-single" : "",
                isInRange ? "is-in-range" : "",
                isToday ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={ymd}
                  type="button"
                  className={classes}
                  aria-label={`${day} ${MONTHS_FULL[viewMonth]} ${viewYear}`}
                  aria-pressed={isStart || isEnd || isInRange}
                  onMouseEnter={() => {
                    if (pickingEnd) setHoverDate(ymd);
                  }}
                  onClick={() => handleDayClick(ymd)}
                >
                  <span>{day}</span>
                </button>
              );
            })}
          </div>

          <div className="drp-foot">
            <button
              type="button"
              className="drp-foot-btn"
              onClick={handleReset}
              disabled={!hasValue}
            >
              Semua waktu
            </button>
            <button
              type="button"
              className="drp-foot-btn is-primary"
              onClick={() => {
                setOpen(false);
                setPickingEnd(false);
                setHoverDate("");
              }}
            >
              Selesai
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
