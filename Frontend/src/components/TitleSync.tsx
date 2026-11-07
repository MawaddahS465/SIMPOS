import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/* Judul tab per role — supaya Kasir/Admin/Pemilik gampang dibedakan saat banyak tab terbuka. */
const TITLES: Array<[RegExp, string]> = [
  [/^\/owner(\/|$)/, "Pemilik — SIMPOS"],
  [/^\/admin(\/|$)/, "Admin — SIMPOS"],
  [/^\/login$/, "Kasir — SIMPOS"],
  [
    /^\/(dashboard|transaksi-baru|checkout|transaksi-berhasil|pemesanan|riwayat-transaksi|pelanggan|resep-mata|pembayaran)(\/|$)/,
    "Kasir — SIMPOS",
  ],
];

export default function TitleSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    const hit = TITLES.find(([re]) => re.test(pathname));
    document.title = hit ? hit[1] : "SIMPOS — Optik Mekar Jaya";
  }, [pathname]);

  return null;
}
