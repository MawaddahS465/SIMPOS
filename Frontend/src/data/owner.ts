import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Building2,
  Boxes,
  FilePlus2,
  Truck,
  History,
  Receipt,
  ClipboardList,
  BarChart3,
  Settings,
} from "lucide-react";

export type OwnerNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Tahap berikutnya = tampil nonaktif dengan tag, tanpa dead link. */
  ready?: boolean;
};

export type OwnerNavGroup = { title: string; items: OwnerNavItem[] };

/** Sidebar Pemilik — monitoring lintas lokasi; tanpa fitur Kasir/Admin operasional. */
export const OWNER_NAV: OwnerNavGroup[] = [
  {
    title: "UTAMA",
    items: [{ label: "Dashboard", to: "/owner/dashboard", icon: LayoutGrid, ready: true }],
  },
  {
    title: "MONITORING",
    items: [
      { label: "Cabang", to: "/owner/cabang", icon: Building2, ready: true },
      { label: "Stok", to: "/owner/stok", icon: Boxes, ready: true },
    ],
  },
  {
    title: "KEPUTUSAN",
    items: [
      { label: "Persetujuan Pengajuan", to: "/owner/pengajuan", icon: FilePlus2, ready: true },
      { label: "Alokasi Distribusi", to: "/owner/alokasi", icon: Truck, ready: true },
    ],
  },
  {
    title: "PENGAWASAN",
    items: [
      { label: "Riwayat Mutasi", to: "/owner/mutasi", icon: History, ready: true },
      { label: "Transaksi", to: "/owner/transaksi", icon: Receipt, ready: true },
      { label: "Pemesanan (PO)", to: "/owner/pemesanan", icon: ClipboardList, ready: true },
      { label: "Laporan", to: "/owner/laporan", icon: BarChart3, ready: true },
    ],
  },
  {
    title: "PENGATURAN",
    items: [{ label: "Pengaturan", to: "/owner/pengaturan", icon: Settings, ready: true }],
  },
];
