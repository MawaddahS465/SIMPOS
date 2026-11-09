import type { PoStatus } from "../data/mock";
import type { ApiOrder, ApiOrderItem, ApiOrderTimeline } from "./api";

export type KasirPo = {
  id: string;
  number: string;
  date: string;
  customer: string;
  initials: string;
  phone: string;
  products: string[];
  productLabel: string;
  status: PoStatus;
  createdAt: string;
  note: string;
  items: Array<{ name: string; sub: string; qty: number; price?: number; productId?: string }>;
  total: number;
  resep: boolean;
  timeline: Array<{ at: string; actor: string; from: string; to: PoStatus; note: string }>;
  productId?: string;
  linkedTrx?: string;
  customerId: number;
  resepSnapshot: {
    od: { sph: string; cyl: string; axis: string };
    os: { sph: string; cyl: string; axis: string };
    pd: string;
    add: string;
    at: string;
  } | null;
};

const STATUS: Record<string, PoStatus> = {
  dipesan: "Dipesan",
  menunggu: "Dipesan",
  diproses: "Diproses",
  sudah_datang: "Sudah Datang",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export function poStatus(value: string): PoStatus {
  return STATUS[value] ?? "Dipesan";
}

function formattedDate(value: string | null | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formattedDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return `${parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} · ${parsed
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":")} WIB`;
}

export function mapApiPo(
  order: ApiOrder,
  items: ApiOrderItem[] = [],
  timeline: ApiOrderTimeline[] = [],
): KasirPo {
  const customerName = order.nama_pelanggan ?? "Pelanggan";
  const initials = customerName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  const products = items.map((item) => item.nama_barang);
  const productLabel = order.produk_label?.replace(/\|/g, ", ") || products.join(", ") || "Produk PO";
  const recipe = order.id_resep
    ? {
        od: { sph: order.od_sph ?? "-", cyl: order.od_cyl ?? "-", axis: order.od_axis ?? "-" },
        os: { sph: order.os_sph ?? "-", cyl: order.os_cyl ?? "-", axis: order.os_axis ?? "-" },
        pd: order.pd ?? "-",
        add: order.add_power ?? "-",
        at: formattedDate(order.tanggal_po),
      }
    : null;

  return {
    id: String(order.id_po),
    number: order.kode_po,
    date: formattedDate(order.tanggal_po),
    customer: customerName,
    initials,
    phone: order.no_hp ?? "-",
    products: products.length ? products : productLabel.split("|"),
    productLabel,
    status: poStatus(order.status),
    createdAt: formattedDateTime(order.tanggal_po),
    note: order.catatan ?? "-",
    items: items.map((item) => ({
      name: item.nama_barang,
      sub: [item.jenis, item.merek].filter(Boolean).join(" · "),
      qty: Number(item.jumlah),
      price: Number(item.harga),
      productId: String(item.barang_id),
    })),
    total: Number(order.total ?? items.reduce((sum, item) => sum + Number(item.subtotal), 0)),
    resep: Boolean(order.id_resep),
    timeline: timeline.map((entry) => ({
      at: formattedDateTime(entry.created_at),
      actor: entry.actor_nama ?? "Sistem",
      from: entry.dari_status ? poStatus(entry.dari_status) : "",
      to: poStatus(entry.ke_status),
      note: entry.catatan ?? "",
    })),
    productId: items.length === 1 ? String(items[0].barang_id) : undefined,
    linkedTrx: order.kode_transaksi ?? undefined,
    customerId: Number(order.pelanggan_id ?? 0),
    resepSnapshot: recipe,
  };
}
