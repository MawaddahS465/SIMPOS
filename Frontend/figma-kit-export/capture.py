# -*- coding: utf-8 -*-
"""Capture ulang semua halaman SIMPOS untuk paket desain Figma.

Pemakaian (dari folder simpos-optik, dev server harus hidup):
    python .\figma-kit-export\capture.py
"""
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5173"
OUT = os.path.dirname(os.path.abspath(__file__))
DESK = os.path.join(OUT, "desktop")
MOB = os.path.join(OUT, "mobile")
os.makedirs(DESK, exist_ok=True)
os.makedirs(MOB, exist_ok=True)

SESS = {
    "kasir": '{"role":"kasir","name":"Korena Saif","initials":"KS","branch":"Cabang Padang","branchId":"cabang-padang","email":"kasir@mekarjaya.demo"}',
    "admin": '{"role":"admin","name":"Rina Amelia","initials":"RA","branch":"Cabang Padang","branchId":"cabang-padang","email":"admin@mekarjaya.demo"}',
    "pemilik": '{"role":"pemilik","name":"Agus Wijaya","initials":"AW","branch":"Seluruh Cabang","branchId":"all","email":"owner@mekarjaya.demo"}',
}

HIDE_SCROLL = "::-webkit-scrollbar{display:none!important}html{scrollbar-width:none!important}"

PAGES = [
    ("01 Kasir - Login", "kasir", "/login", "Login Kasir"),
    ("02 Kasir - Dashboard", "kasir", "/dashboard", "Dashboard Kasir"),
    ("03 Kasir - Transaksi Baru", "kasir", "/transaksi-baru", "Transaksi Baru"),
    ("04 Kasir - Checkout", "kasir", "/checkout", "Checkout"),
    ("05 Kasir - Transaksi Berhasil", "kasir", "/transaksi-berhasil", "Transaksi Berhasil"),
    ("06 Kasir - Pemesanan", "kasir", "/pemesanan", "Pemesanan (PO)"),
    ("07 Kasir - Detail PO", "kasir", "/pemesanan/PO-2026-0108", "Detail PO"),
    ("08 Kasir - Riwayat Transaksi", "kasir", "/riwayat-transaksi", "Riwayat Transaksi"),
    ("09 Kasir - Pelanggan", "kasir", "/pelanggan", "Pelanggan"),
    ("10 Kasir - Resep Mata", "kasir", "/resep-mata", "Resep Mata"),
    ("11 Kasir - Pembayaran", "kasir", "/pembayaran", "Pembayaran"),
    ("12 Admin - Login", "admin", "/admin/login", "Login Admin"),
    ("13 Admin - Dashboard", "admin", "/admin/dashboard", "Dashboard Admin"),
    ("14 Admin - Produk Frame", "admin", "/admin/produk/frame", "Produk Frame"),
    ("15 Admin - Produk Lensa", "admin", "/admin/produk/lensa", "Produk Lensa"),
    ("16 Admin - Stok", "admin", "/admin/stok", "Stok"),
    ("17 Admin - Penerimaan", "admin", "/admin/penerimaan", "Penerimaan Barang"),
    ("18 Admin - Distribusi", "admin", "/admin/distribusi", "Distribusi"),
    ("19 Admin - Pengajuan", "admin", "/admin/pengajuan", "Pengajuan Stok"),
    ("20 Admin - Pemesanan", "admin", "/admin/pemesanan", "Pemesanan (PO)"),
    ("21 Admin - Detail PO", "admin", "/admin/pemesanan/PO-2026-0108", "Detail PO"),
    ("22 Admin - Mutasi", "admin", "/admin/mutasi", "Mutasi Stok"),
    ("23 Pemilik - Login", "pemilik", "/owner/login", "Login Pemilik"),
    ("24 Pemilik - Dashboard", "pemilik", "/owner/dashboard", "Dashboard Pemilik"),
    ("25 Pemilik - Cabang", "pemilik", "/owner/cabang", "Cabang"),
    ("26 Pemilik - Detail Cabang", "pemilik", "/owner/cabang/cabang-padang", "Detail Cabang"),
    ("27 Pemilik - Stok", "pemilik", "/owner/stok", "Stok"),
    ("28 Pemilik - Pengajuan", "pemilik", "/owner/pengajuan", "Pengajuan Barang"),
    ("29 Pemilik - Alokasi", "pemilik", "/owner/alokasi", "Alokasi Distribusi"),
    ("30 Pemilik - Mutasi", "pemilik", "/owner/mutasi", "Mutasi Stok"),
    ("31 Pemilik - Transaksi", "pemilik", "/owner/transaksi", "Transaksi"),
    ("32 Pemilik - Pemesanan", "pemilik", "/owner/pemesanan", "Pemesanan (PO)"),
    ("33 Pemilik - Laporan", "pemilik", "/owner/laporan", "Laporan"),
    ("34 Pemilik - Pengaturan", "pemilik", "/owner/pengaturan", "Pengaturan — Pengguna"),
]

EXTRA = [
    ("35 Pemilik - Pengaturan Hak Akses", "akses", "Hak Akses", False),
    ("36 Pemilik - Pengaturan Toko", "toko", "Toko", True),
    ("37 Pemilik - Pengaturan Preferensi", "preferensi", "Preferensi", False),
]

manifest = []


def seed(pg, role):
    pg.goto(BASE + "/login", wait_until="domcontentloaded")
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", SESS[role])


def add(name, role, judul, path, folder, note=""):
    manifest.append({"file": name + ".png", "role": role, "judul": judul, "path": path,
                     "catatan": note, "folder": folder})
    print("OK", name)


def shot(pg, folder, name, role, path, judul, note=""):
    pg.goto(BASE + path, wait_until="networkidle")
    pg.add_style_tag(content=HIDE_SCROLL)
    pg.wait_for_timeout(1000)
    pg.screenshot(path=os.path.join(OUT, folder, name + ".png"))
    add(name, role, judul, path, folder, note)


with sync_playwright() as p:
    b = p.chromium.launch()

    for role in ("kasir", "admin", "pemilik"):
        pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        seed(pg, role)
        for name, r, path, judul in [x for x in PAGES if x[1] == role]:
            if path == "/checkout":
                pg.goto(BASE + "/transaksi-baru", wait_until="networkidle")
                pg.wait_for_timeout(700)
                pg.get_by_role("button", name="Urban Square").first.click()
                pg.wait_for_timeout(400)
                pg.get_by_role("link", name="Lanjut ke Checkout").click()
                pg.wait_for_timeout(1200)
                pg.add_style_tag(content=HIDE_SCROLL)
                pg.screenshot(path=os.path.join(DESK, name + ".png"))
                add(name, role, judul, path, "desktop", "dengan 1 item keranjang")
                continue
            shot(pg, "desktop", name, role, path, judul)

        if role == "pemilik":
            for name, _key, label, exact in EXTRA:
                pg.goto(BASE + "/owner/pengaturan", wait_until="networkidle")
                pg.get_by_role("button", name=label, exact=exact).click()
                pg.wait_for_timeout(800)
                pg.screenshot(path=os.path.join(DESK, name + ".png"))
                add(name, role, "Pengaturan — " + label, "/owner/pengaturan", "desktop", "tab " + label.lower())

            pg.goto(BASE + "/owner/pengaturan", wait_until="networkidle")
            pg.get_by_role("button", name="Tambah Pengguna").click()
            pg.wait_for_timeout(800)
            pg.screenshot(path=os.path.join(DESK, "38 Pemilik - Pengaturan Drawer Pengguna.png"))
            add("38 Pemilik - Pengaturan Drawer Pengguna", role,
                "Pengaturan — Drawer Tambah Pengguna", "/owner/pengaturan", "desktop", "modal")
        pg.close()

    mp = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                    is_mobile=True, has_touch=True)
    seed(mp, "kasir")
    for name, _r, path, judul in [x for x in PAGES if x[1] == "kasir"]:
        mname = name.replace("Kasir - ", "")
        if path == "/checkout":
            mp.goto(BASE + "/transaksi-baru", wait_until="networkidle")
            mp.wait_for_timeout(700)
            mp.get_by_role("button", name="Urban Square").first.click()
            mp.wait_for_timeout(400)
            mp.get_by_role("link", name="Lanjut ke Checkout").click()
            mp.wait_for_timeout(1200)
            mp.add_style_tag(content=HIDE_SCROLL)
            mp.screenshot(path=os.path.join(MOB, mname + ".png"))
            add(mname, "kasir", judul, path, "mobile", "dengan 1 item keranjang")
            continue
        mp.goto(BASE + path, wait_until="networkidle")
        mp.add_style_tag(content=HIDE_SCROLL)
        mp.wait_for_timeout(900)
        mp.screenshot(path=os.path.join(MOB, mname + ".png"))
        add(mname, "kasir", judul, path, "mobile")
    mp.close()
    b.close()

with open(os.path.join(OUT, "MANIFEST.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT, "MANIFEST.csv"), "w", encoding="utf-8-sig", newline="") as f:
    f.write("folder;file;role;judul;route;catatan\n")
    for m in manifest:
        f.write(f"{m['folder']};{m['file']};{m['role']};{m['judul']};{m['path']};{m['catatan']}\n")

print("TOTAL SHOT:", len(manifest))
print("Jalankan build_index.py untuk memperbarui galeri index.html")
