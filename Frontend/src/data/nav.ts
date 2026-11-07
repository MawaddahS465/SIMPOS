import {
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  History,
  Users,
  Glasses,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutGrid },
  { label: "Transaksi Baru", to: "/transaksi-baru", icon: ShoppingCart },
  { label: "Pemesanan (PO)", to: "/pemesanan", icon: ClipboardList },
  { label: "Riwayat Transaksi", to: "/riwayat-transaksi", icon: History },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Pelanggan", to: "/pelanggan", icon: Users },
  { label: "Resep Mata", to: "/resep-mata", icon: Glasses },
];
