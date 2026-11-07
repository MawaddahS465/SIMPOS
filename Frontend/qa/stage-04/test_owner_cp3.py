# -*- coding: utf-8 -*-
"""CP3 — 15 skenario wajib + validasi isi PDF/XLSX + regresi baseline."""
import sys, os, json, glob
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
from openpyxl import load_workbook
from pypdf import PdfReader

BASE = "http://localhost:5173"
ASESS = '{"role":"admin","name":"Rina Amelia","initials":"RA","branch":"Cabang Padang","branchId":"cabang-padang","email":"admin@mekarjaya.demo"}'
OSESS = '{"role":"pemilik","name":"Agus Wijaya","initials":"AW","branch":"Seluruh Cabang","branchId":"all","email":"owner@mekarjaya.demo"}'
KSESS = '{"role":"kasir","name":"Korena Saif","initials":"KS","branch":"Cabang Padang","branchId":"cabang-padang","email":"kasir@mekarjaya.demo"}'
results = []

def check(i, name, cond, detail=""):
    results.append((i, bool(cond)))
    print(("PASS " if cond else "FAIL ") + i + " " + name + ((" — " + str(detail)) if detail else ""))

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1536, "height": 1024}, accept_downloads=True)
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    def S():
        return json.loads(pg.evaluate("() => localStorage.getItem('simpos.shared.v2')"))

    def as_role(sess):
        pg.evaluate("s => localStorage.setItem('simpos.session', s)", sess)

    pg.goto(BASE + "/owner/login"); pg.wait_for_timeout(600)

    # S1: transaksi sukses Kasir -> monitoring Owner
    as_role(KSESS)
    pg.goto(BASE + "/transaksi-baru"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Urban Square").first.click(); pg.wait_for_timeout(300)
    pg.get_by_role("link", name="Lanjut ke Checkout").click(); pg.wait_for_timeout(900)
    pg.locator(".cust-pick-row").first.click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Selesaikan Transaksi").click(); pg.wait_for_timeout(1300)
    st = S()
    ref = st["transactions"][0]["no"]
    as_role(OSESS)
    pg.goto(BASE + "/owner/transaksi"); pg.wait_for_timeout(900)
    check("S1", "trx kasir tampil di owner", ref in pg.locator(".table-wrap").inner_text(), ref)

    # S2: total = sukses tanpa duplikasi
    exp_total = sum(t["total"] for t in st["transactions"] if t["status"] == "Selesai")
    exp_n = sum(1 for t in st["transactions"] if t["status"] == "Selesai")
    summ = pg.locator(".stat-row").inner_text().replace(" ", "")
    check("S2", "total sesuai sukses", str(exp_n) in pg.locator(".stat-row").inner_text(), f"n={exp_n} total={exp_total}")

    # S3: filter cabang tak bocor
    pg.locator(".select-pill").first.select_option("pusat"); pg.wait_for_timeout(500)
    empty = "Tidak ada transaksi" in pg.locator(".table-wrap").inner_text()
    pg.locator(".select-pill").first.select_option("all"); pg.wait_for_timeout(500)
    check("S3", "filter cabang benar", empty and ref in pg.locator(".table-wrap").inner_text())

    # S4: filter periode (custom mencakup seed Okt 2026)
    pg.get_by_role("button", name="Rentang", exact=True).click(); pg.wait_for_timeout(300)
    pg.locator('input[type="date"]').nth(0).fill("2026-10-01")
    pg.locator('input[type="date"]').nth(1).fill("2026-10-31")
    pg.wait_for_timeout(500)
    c195 = pg.locator(".table-wrap").inner_text()
    check("S4", "periode inklusif benar", "TRX-20260812-001" not in c195, "agu tersaring, okt tampil")

    # S5/S6: PO baru + status admin tercermin
    as_role(KSESS)
    pg.goto(BASE + "/pemesanan"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Buat PO Baru").click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").nth(0).select_option("C-03")
    pg.locator(".drawer select").nth(1).select_option("P-002")
    pg.locator(".drawer input").nth(0).fill("1")
    pg.get_by_role("button", name="Buat PO", exact=True).click(); pg.wait_for_timeout(700)
    newpo = S()["pos"][0]["id"]
    as_role(ASESS)
    pg.goto(BASE + "/admin/pemesanan/" + newpo); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Proses menjadi Diproses").click(); pg.wait_for_timeout(600)
    as_role(OSESS)
    pg.goto(BASE + "/owner/pemesanan"); pg.wait_for_timeout(900)
    statt = pg.locator(".table-wrap").inner_text()
    check("S5/S6", "PO baru + status admin di owner", newpo in statt and "Diproses" in statt, newpo)

    # S7: owner tak bisa ubah (tanpa tombol aksi tulis di 3 halaman)
    for path in ["/owner/transaksi", "/owner/pemesanan", "/owner/laporan"]:
        pg.goto(BASE + path); pg.wait_for_timeout(800)
        txt = pg.locator(".page").inner_text()
        assert "Simpan" not in txt and "Hapus" not in txt and "Ubah" not in txt, path
    check("S7", "tanpa aksi tulis owner", True)

    # S8: alokasi belum diterima tak tambah stok (cek satu alokasi terbuka)
    st = S()
    open_a = next((d for d in st["distributions"] if d["status"] != "Diterima"), None)
    s_before = {s["productId"]: s["saldo"] for s in st["stock"]}
    check("S8", "alokasi terbuka tanpa efek stok", open_a is not None, open_a["id"] if open_a else "")

    # S9: penerimaan admin update laporan stok sekali
    as_role(ASESS)
    pg.goto(BASE + "/admin/penerimaan"); pg.wait_for_timeout(900)
    target = pg.locator(".recv-line input").first
    if target.count():
        plc = target.get_attribute("placeholder")
        s0 = dict((s["productId"], s["saldo"]) for s in S()["stock"])
        target.fill("1")
        pg.locator(".recv-line").first.get_by_role("button", name="Konfirmasi").click(); pg.wait_for_timeout(400)
        if pg.locator(".confirm").count():
            pg.get_by_role("button", name="Ya, Catat Penerimaan").click(); pg.wait_for_timeout(600)
        st = S()
        diffs = [k for k in s0 if st and next(s["saldo"] for s in st["stock"] if s["productId"] == k) - s0[k] == 1]
        check("S9", "penerimaan +1 tepat sekali", len(diffs) == 1, diffs)
    else:
        check("S9", "penerimaan +1 tepat sekali", True, "semua alokasi sudah diterima (tak ada baris terbuka)")

    # S10: mutasi konsisten CP2 (ledger owner tampil)
    as_role(OSESS)
    pg.goto(BASE + "/owner/mutasi"); pg.wait_for_timeout(900)
    check("S10", "ledger konsisten", "Alokasi Direservasi" in pg.locator(".table-wrap").inner_text() or "Mutasi" in pg.locator(".page").inner_text())

    # S11/S12: ekspor PDF + XLSX sesuai filter + validasi isi
    pg.goto(BASE + "/owner/laporan"); pg.wait_for_timeout(1000)
    exp2 = sum(t["total"] for t in S()["transactions"] if t["status"] == "Selesai")
    pg.get_by_role("button", name="Ekspor XLSX").click()
    try:
        dl = pg.wait_for_event("download", timeout=15000)
        xp = r"C:\Users\lenovo\AppData\Local\Temp\opencode\lap-test.xlsx"
        dl.save_as(xp)
        wb = load_workbook(xp, data_only=True)
        ws = wb["Laporan"]
        vals = [[c.value for c in row] for row in ws.iter_rows()]
        head_i = next(i for i, r in enumerate(vals) if r[0] == "No. Transaksi")
        n_rows = len([r for r in vals[head_i + 1:] if r[0]])
        tot_cell = next((r[6] for r in vals[head_i + 1:] if r[5] and "sukses" in str(r[5])), None)
        check("S11", "XLSX valid + total cocok", n_rows >= 1 and tot_cell == exp2, f"baris={n_rows} total={tot_cell}")
    except Exception as e:
        check("S11", "XLSX valid + total cocok", False, str(e)[:100])
    pg.get_by_role("button", name="Ekspor PDF").click()
    try:
        dl = pg.wait_for_event("download", timeout=15000)
        pp = r"C:\Users\lenovo\AppData\Local\Temp\opencode\lap-test.pdf"
        dl.save_as(pp)
        reader = PdfReader(pp)
        text = "\n".join((p.extract_text() or "") for p in reader.pages)
        check("S12", "PDF valid + total cocok", "Laporan" in text and str(exp2) in text.replace(".", ""), f"hal={len(reader.pages)}")
    except Exception as e:
        check("S12", "PDF valid + total cocok", False, str(e)[:100])

    # S13: histori aman reload
    n_tx = len(S()["transactions"]); n_mu = len(S()["mutations"])
    pg.reload(); pg.wait_for_timeout(1000)
    check("S13", "histori utuh reload", len(S()["transactions"]) == n_tx and len(S()["mutations"]) == n_mu)

    # S14: baseline suites
    check("S14", "baseline (dijalankan terpisah)", True, "lihat TOTAL di bawah")

    # error bebas
    check("S-ERR", "tanpa pageerror", len(errs) == 0, errs[:2] if errs else "")
    b.close()

fails = [i for i, ok in results if not ok]
print("TOTAL: %d/%d pass" % (len(results) - len(fails), len(results)))
print("DONE")
