import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Frame,
  CircleDot,
  Boxes,
  PackageCheck,
  FilePlus2,
  History,
  ClipboardList,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

/** Sidebar Admin Cabang — dikelompokkan sesuai MASTER_PROMPT (bukan menu Kasir). */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "UTAMA",
    items: [{ label: "Dashboard", to: "/admin/dashboard", icon: LayoutGrid }],
  },
  {
    title: "MASTER PRODUK",
    items: [
      { label: "Frame", to: "/admin/produk/frame", icon: Frame },
      { label: "Lensa", to: "/admin/produk/lensa", icon: CircleDot },
    ],
  },
  {
    title: "PERSEDIAAN",
    items: [
      { label: "Stok Cabang", to: "/admin/stok", icon: Boxes },
      { label: "Penerimaan Barang", to: "/admin/penerimaan", icon: PackageCheck },
      { label: "Pengajuan Stok", to: "/admin/pengajuan", icon: FilePlus2 },
      { label: "Riwayat Mutasi", to: "/admin/mutasi", icon: History },
    ],
  },
  {
    title: "OPERASIONAL",
    items: [{ label: "Pemesanan (PO)", to: "/admin/pemesanan", icon: ClipboardList }],
  },
];

/** Identitas demo Admin untuk seed/data bisnis lokal — bukan kredensial login. */
export const DEMO_ADMIN = {
  name: "Rina Amelia",
  branch: "Cabang Padang",
};

export const ADMIN_STORE_KEY = "simpos.admin.store.v2";
