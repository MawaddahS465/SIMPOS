import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  CheckCheck,
  ClipboardList,
  FilePlus2,
  PackageCheck,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useSharedStore } from "../store/sharedStore";

type Role = "kasir" | "admin" | "pemilik";

type Tone = "info" | "warn" | "danger" | "ok";

type NotifItem = {
  id: string;
  title: string;
  sub: string;
  to: string;
  tone: Tone;
  icon: LucideIcon;
};

const READ_KEY = "simpos.notifRead.v1";

function loadRead(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

/** Notifikasi demo dirakit dari data store yang sama dengan halaman asalnya. */
function buildItems(role: Role, store: ReturnType<typeof useSharedStore>): NotifItem[] {
  const out: NotifItem[] = [];

  if (role === "pemilik") {
    for (const n of store.notices.slice(0, 4)) {
      out.push({
        id: `notice-${n.id}`,
        title: n.kind,
        sub: `${n.summary} · ${n.at}`,
        to: "/owner/pengajuan",
        tone: "info",
        icon: FilePlus2,
      });
    }
    if (store.requests.length && store.notices.length === 0) {
      out.push({
        id: "owner-pengajuan",
        title: "Pengajuan stok",
        sub: `${store.requests.length} pengajuan dari cabang menunggu tinjauan`,
        to: "/owner/pengajuan",
        tone: "info",
        icon: FilePlus2,
      });
    }
    if (store.lowStock.length) {
      out.push({
        id: "owner-stok-menipis",
        title: "Stok menipis",
        sub: `${store.lowStock.length} produk di bawah batas minimum`,
        to: "/owner/stok",
        tone: "danger",
        icon: TriangleAlert,
      });
    }
    const po = store.pos.filter((o) => o.status === "Dipesan" || o.status === "Diproses").length;
    if (po) {
      out.push({
        id: "owner-po-aktif",
        title: "PO berjalan",
        sub: `${po} PO sedang diproses admin cabang`,
        to: "/owner/pemesanan",
        tone: "warn",
        icon: ClipboardList,
      });
    }
  }

  if (role === "admin") {
    const poBaru = store.pos.filter((o) => o.status === "Dipesan").length;
    if (poBaru) {
      out.push({
        id: "admin-po-baru",
        title: "PO baru",
        sub: `${poBaru} pesanan pelanggan perlu diproses`,
        to: "/admin/pemesanan",
        tone: "info",
        icon: ClipboardList,
      });
    }
    if (store.lowStock.length) {
      out.push({
        id: "admin-stok-menipis",
        title: "Stok menipis",
        sub: `${store.lowStock.length} produk di bawah batas minimum`,
        to: "/admin/stok",
        tone: "danger",
        icon: TriangleAlert,
      });
    }
    if (store.requests.length) {
      out.push({
        id: "admin-pengajuan",
        title: "Pengajuan stok terkirim",
        sub: `${store.requests.length} pengajuan menunggu persetujuan Pemilik`,
        to: "/admin/pengajuan",
        tone: "warn",
        icon: FilePlus2,
      });
    }
  }

  if (role === "kasir") {
    const datang = store.pos.filter((o) => o.status === "Sudah Datang").length;
    if (datang) {
      out.push({
        id: "kasir-po-datang",
        title: "PO sudah datang",
        sub: `${datang} pesanan siap diambil pelanggan`,
        to: "/pemesanan",
        tone: "ok",
        icon: PackageCheck,
      });
    }
    const pending = store.transactions.filter((t) => t.status === "Pending").length;
    if (pending) {
      out.push({
        id: "kasir-pembayaran-tertunda",
        title: "Pembayaran tertunda",
        sub: `${pending} transaksi belum diselesaikan`,
        to: "/riwayat-transaksi",
        tone: "warn",
        icon: Wallet,
      });
    }
  }

  return out;
}

export default function NotificationBell({ role }: { role: Role }) {
  const store = useSharedStore();
  const navigate = useNavigate();
  const wrap = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>(() => loadRead()[role] ?? []);

  const items = useMemo(() => buildItems(role, store), [role, store]);
  const unread = items.filter((i) => !read.includes(i.id));

  useEffect(() => {
    const all = loadRead();
    all[role] = read;
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(all));
    } catch {
      /* demo tetap jalan in-memory */
    }
  }, [role, read]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openItem(item: NotifItem) {
    setRead((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
    setOpen(false);
    navigate(item.to);
  }

  return (
    <div className="notif-wrap" ref={wrap}>
      <button
        className={"icon-pill notif-btn" + (open ? " is-open" : "")}
        aria-label={unread.length ? `Notifikasi, ${unread.length} baru` : "Notifikasi"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={19} />
        {unread.length > 0 && <span className="dot" />}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifikasi">
          <div className="notif-head">
            <div>
              <b>Notifikasi</b>
              <span className="notif-sub">{unread.length ? `${unread.length} baru` : "Semua sudah dibaca"}</span>
            </div>
            {unread.length > 0 && (
              <button className="notif-readall" onClick={() => setRead(items.map((i) => i.id))}>
                <CheckCheck size={14} />
                Tandai dibaca
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="notif-empty">
              <BellOff size={22} />
              <span>Belum ada notifikasi.</span>
            </div>
          ) : (
            <ul className="notif-list">
              {items.map((item) => {
                const Icon = item.icon;
                const isRead = read.includes(item.id);
                return (
                  <li key={item.id}>
                    <button className={"notif-item" + (isRead ? " is-read" : "")} onClick={() => openItem(item)}>
                      <span className={`notif-ic tone-${item.tone}`}>
                        <Icon size={17} />
                      </span>
                      <span className="notif-text">
                        <b>{item.title}</b>
                        <span>{item.sub}</span>
                      </span>
                      {!isRead && <span className="notif-new" aria-label="Baru" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
