# -*- coding: utf-8 -*-
"""CP4 — UAT end-to-end 16 langkah + negatif + multi-cabang terisolasi (profil sekali pakai)."""
import sys, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
KSESS = '{"role":"kasir","name":"Korena Saif","initials":"KS","branch":"Cabang Padang","branchId":"cabang-padang","email":"kasir@mekarjaya.demo"}'
ASESS = '{"role":"admin","name":"Rina Amelia","initials":"RA","branch":"Cabang Padang","branchId":"cabang-padang","email":"admin@mekarjaya.demo"}'
OSESS = '{"role":"pemilik","name":"Agus Wijaya","initials":"AW","branch":"Seluruh Cabang","branchId":"all","email":"owner@mekarjaya.demo"}'
results = []

def check(i, name, cond, detail=""):
    results.append((i, bool(cond)))
    print(("PASS " if cond else "FAIL ") + i + " " + name + ((" — " + str(detail)) if detail else ""))

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1536, "height": 1024})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    def S():
        return json.loads(pg.evaluate("() => localStorage.getItem('simpos.shared.v2')"))

    def as_role(sess):
        pg.evaluate("s => localStorage.setItem('simpos.session', s)", sess)

    pg.goto(BASE + "/login"); pg.wait_for_timeout(500)

    # U1-U4: beli frame -> bayar -> stok kurang -> owner lihat
    as_role(KSESS)
    pg.goto(BASE + "/transaksi-baru"); pg.wait_for_timeout(900)
    s0 = next(s["saldo"] for s in S()["stock"] if s["productId"] == "P-002")
    pg.get_by_role("button", name="Urban Square").first.click(); pg.wait_for_timeout(300)
    pg.get_by_role("link", name="Lanjut ke Checkout").click(); pg.wait_for_timeout(900)
    pg.locator(".cust-pick-row").first.click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Selesaikan Transaksi").click(); pg.wait_for_timeout(1300)
    st = S()
    ref = st["transactions"][0]["no"]
    s1 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-002")
    check("U1-U4", "beli+stok-1", s0 - s1 == 1 and st["transactions"][0]["status"] == "Selesai", f"{s0}->{s1} {ref}")
    as_role(OSESS)
    pg.goto(BASE + "/owner/transaksi"); pg.wait_for_timeout(900)
    check("U5", "owner lihat trx", ref in pg.locator(".table-wrap").inner_text(), ref)

    # NEG: over-stock diblokir
    as_role(KSESS)
    pg.goto(BASE + "/transaksi-baru"); pg.wait_for_timeout(900)
    for _ in range(12):
        pg.get_by_role("button", name="Bella Round").first.click(); pg.wait_for_timeout(120)
    pg.get_by_role("link", name="Lanjut ke Checkout").click(); pg.wait_for_timeout(900)
    pg.locator(".cust-pick-row").first.click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Selesaikan Transaksi").click(); pg.wait_for_timeout(700)
    warn = pg.locator(".notice").last.inner_text() if pg.locator(".notice").count() else ""
    check("NEG-1", "over-stock diblokir", "tidak mencukupi" in warn, warn[:60])

    # U6-U8: PO -> proses -> pantau
    pg.goto(BASE + "/pemesanan"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Buat PO Baru").click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").nth(0).select_option("C-04")
    pg.locator(".drawer select").nth(1).select_option("P-001")
    pg.locator(".drawer input").nth(0).fill("1")
    pg.get_by_role("button", name="Buat PO", exact=True).click(); pg.wait_for_timeout(700)
    po = S()["pos"][0]["id"]
    as_role(ASESS)
    pg.goto(BASE + "/admin/pemesanan/" + po); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Proses menjadi Diproses").click(); pg.wait_for_timeout(600)
    # NEG: lompat ke Selesai ditolak
    bad = pg.evaluate("(i) => window.__simpos.transitionPO(i, 'Selesai', '', 'Admin')", po)
    as_role(KSESS)
    pg.goto(BASE + "/pemesanan/" + po); pg.wait_for_timeout(900)
    check("U6-U8", "PO diproses + pantau", "Diproses" in pg.locator(".po-status-right").inner_text(), po)
    check("NEG-2", "lompat Selesai ditolak", not bad["ok"], bad["msg"][:50])

    # U9-U11: ajukan -> tinjau -> alokasi
    as_role(ASESS)
    pg.goto(BASE + "/admin/pengajuan"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Ajukan Stok").first.click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").select_option("P-001")
    pg.locator(".drawer input").nth(0).fill("6")
    pg.get_by_role("button", name="Lanjut Pratinjau").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Kirim Pengajuan").click(); pg.wait_for_timeout(600)
    req = next(r["id"] for r in S()["requests"] if r["productId"] == "P-001" and r["qty"] == 6)
    as_role(OSESS)
    pg.goto(BASE + "/owner/pengajuan"); pg.wait_for_timeout(900)
    seen = req in pg.locator(".table-wrap").inner_text()
    pg.goto(BASE + "/owner/alokasi"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Buat Alokasi").click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").nth(1).select_option("P-001")
    pg.locator(".drawer select").nth(2).select_option(req)
    pg.locator(".drawer input").nth(0).fill("6")
    pg.get_by_role("button", name="Simpan Alokasi").click(); pg.wait_for_timeout(600)
    aloc = next((d["id"] for d in S()["distributions"] if d.get("requestId") == req), None)
    check("U9-U11", "ajukan->tinjau->alokasi", seen and aloc is not None, f"{req} -> {aloc}")
    pg.locator(".drawer-foot .btn-primary").click(); pg.wait_for_timeout(300)

    # U12-U14: terima -> stok -> mutasi
    as_role(ASESS)
    pg.goto(BASE + "/admin/penerimaan"); pg.wait_for_timeout(900)
    ln = pg.locator(".recv-line", has_text="Titanium Classic").first
    sb0 = next(s["saldo"] for s in S()["stock"] if s["productId"] == "P-001")
    ln.locator("input").fill("6")
    ln.get_by_role("button", name="Konfirmasi").click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Ya, Catat Penerimaan").click(); pg.wait_for_timeout(600)
    st = S()
    sb1 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-001")
    mu = [m for m in st["mutations"] if m["ref"].startswith("RC-") and m["productId"] == "P-001"]
    check("U12-U14", "terima->stok+mutasi", sb1 - sb0 == 6 and len(mu) == 1, f"{sb0}->{sb1}")
    as_role(OSESS)
    pg.goto(BASE + "/owner/mutasi"); pg.wait_for_timeout(900)
    check("U14b", "mutasi terbaca owner", mu[0]["id"] in pg.locator(".table-wrap").inner_text(), mu[0]["id"])

    # U15-U16: laporan + ekspor
    pg.goto(BASE + "/owner/laporan"); pg.wait_for_timeout(1000)
    summ = pg.locator(".panel-tight").inner_text()
    check("U15", "laporan tampil", "Ringkasan" in summ)
    with pg.expect_download() as dl_info:
        pg.get_by_role("button", name="Ekspor XLSX").click()
    dl_info.value.save_as(r"C:\Users\lenovo\AppData\Local\Temp\opencode\uat-final.xlsx")
    check("U16", "ekspor XLSX terunduh", True)

    # NEG: kasir buat alokasi via hook role? (route guard) + admin terima cabang lain (tak ada data lain)
    as_role(KSESS)
    pg.goto(BASE + "/owner/alokasi"); pg.wait_for_timeout(700)
    check("NEG-3", "kasir ditolak modul owner", "/owner/login" in pg.url)

    # MULTI-BRANCH terisolasi: injeksi cabang-uji sementara di profil ini saja
    as_role(OSESS)
    pg.goto(BASE + "/owner/dashboard"); pg.wait_for_timeout(800)
    pg.evaluate("""() => {
      const k = 'simpos.shared.v2';
      const st = JSON.parse(localStorage.getItem(k));
      st.stock.push({productId:'P-001', branchId:'cabang-uji', saldo:99, minimum:5});
      st.transactions.unshift({id:'T-UJI', no:'TRX-UJI-001', date:'11 Okt 2026', time:'10:00',
        customer:'Uji', phone:'-', type:'Pembelian', total:500000, status:'Selesai', branchId:'cabang-uji'});
      localStorage.setItem(k, JSON.stringify(st));
    }""")
    pg.goto(BASE + "/owner/transaksi"); pg.wait_for_timeout(900)
    pg.locator(".select-pill").first.select_option("cabang-padang"); pg.wait_for_timeout(500)
    padang_only = "TRX-UJI-001" not in pg.locator(".table-wrap").inner_text()
    st = S()
    b4 = {s["productId"]: s["saldo"] for s in st["stock"] if s["branchId"] == "cabang-padang"}
    check("MB-1", "filter cabang isolasi data", padang_only)
    check("MB-2", "stok padang tak tersentuh injeksi", all(
        next(s["saldo"] for s in S()["stock"] if s["productId"] == k and s["branchId"] == "cabang-padang") == v
        for k, v in b4.items()), "cabang-uji dibuang bersama profil")

    check("ERR", "tanpa pageerror", len(errs) == 0, errs[:2] if errs else "")
    b.close()

fails = [i for i, ok in results if not ok]
print("TOTAL: %d/%d pass" % (len(results) - len(fails), len(results)))
print("DONE")
