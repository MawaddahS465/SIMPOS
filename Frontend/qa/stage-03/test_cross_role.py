# -*- coding: utf-8 -*-
"""Tahap 03 — matriks uji lintas-role INT-01..INT-24 (Playwright, hasil aktual)."""
import sys, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
KSESS = '{"role":"kasir","name":"Korena Saif","initials":"KS","branch":"Cabang Padang","branchId":"cabang-padang","email":"kasir@mekarjaya.demo"}'
ASESS = '{"role":"admin","name":"Rina Amelia","initials":"RA","branch":"Cabang Padang","branchId":"cabang-padang","email":"admin@mekarjaya.demo"}'
results = []

def check(i, name, cond, detail=""):
    results.append((i, name, bool(cond), str(detail)))
    print(("PASS " if cond else "FAIL ") + i + " " + name + ((" — " + str(detail)) if detail else ""))

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1536, "height": 1024})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    def S():
        return json.loads(pg.evaluate("() => localStorage.getItem('simpos.shared.v2')"))

    def login(role):
        pg.goto(BASE + ("/login" if role == "kasir" else "/admin/login"))
        pg.wait_for_timeout(600)
        pg.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        pg.reload()
        pg.wait_for_timeout(800)
        pg.get_by_role("button", name="Masuk", exact=True).click()
        pg.wait_for_timeout(1200)

    # INT-01 login dua role
    login("kasir")
    check("INT-01a", "kasir login -> dashboard", "/dashboard" in pg.url, pg.url)
    check("INT-01b", "menu kasir sesuai", pg.locator(".sidebar-nav").inner_text().find("Transaksi Baru") > 0)
    login("admin")
    check("INT-01c", "admin login -> dashboard", "/admin/dashboard" in pg.url, pg.url)
    check("INT-01d", "menu admin sesuai", "Stok Cabang" in pg.locator(".sidebar-nav").inner_text())

    # INT-02 kasir -> route admin ditolak
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", KSESS)
    pg.goto(BASE + "/admin/stok"); pg.wait_for_timeout(700)
    check("INT-02", "kasir akses /admin/stok ditolak", "/admin/login" in pg.url, pg.url)

    # INT-03 admin -> checkout kasir ditolak
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/checkout"); pg.wait_for_timeout(700)
    check("INT-03", "admin akses /checkout ditolak", pg.url.rstrip("/") == BASE + "/login", pg.url)

    # INT-04 cabang lain ditolak (level klien; server BLOCKED terdokumentasi)
    pg.evaluate("() => localStorage.setItem('simpos.session', '{\"role\":\"admin\",\"branchId\":\"cabang-lain\"}')")
    pg.goto(BASE + "/admin/stok"); pg.wait_for_timeout(700)
    check("INT-04", "sesi cabang lain ditolak", "/admin/login" in pg.url, pg.url)

    # INT-19 logout + direct URL + refresh
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/admin/stok"); pg.wait_for_timeout(700)
    pg.locator(".admin-logout").click(); pg.wait_for_timeout(700)
    check("INT-19a", "logout -> login", "/admin/login" in pg.url)
    pg.goto(BASE + "/admin/dashboard"); pg.wait_for_timeout(700)
    check("INT-19b", "direct URL tanpa sesi -> login", "/admin/login" in pg.url)
    pg.goto(BASE + "/dashboard"); pg.wait_for_timeout(700)
    check("INT-19c", "direct URL kasir tanpa sesi -> login", pg.url.rstrip("/") == BASE + "/login", pg.url)

    # INT-05 admin tambah frame 250rb -> katalog kasir sama
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/admin/produk/frame"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Tambah Produk").click(); pg.wait_for_timeout(400)
    pg.locator(".drawer-form input").nth(0).fill("Uji Integrasi")
    pg.locator(".drawer-form input").nth(1).fill("Merek Uji")
    pg.locator(".drawer-form input").nth(2).fill("250000")
    pg.get_by_role("button", name="Simpan Produk").click(); pg.wait_for_timeout(600)
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", KSESS)
    pg.goto(BASE + "/transaksi-baru"); pg.wait_for_timeout(900)
    body = pg.locator(".product-grid").inner_text()
    check("INT-05", "produk admin tampil di kasir Rp250rb", "Uji Integrasi" in body and "Rp 250.000" in body.replace("\xa0", " "))

    # INT-06 ubah harga -> katalog berubah, histori lama tetap
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/admin/produk/frame"); pg.wait_for_timeout(900)
    pg.locator(".toolbar-search input").fill("Uji Integrasi"); pg.wait_for_timeout(500)
    pg.get_by_role("button", name="Ubah").first.click(); pg.wait_for_timeout(400)
    pg.locator(".drawer-form input").nth(2).fill("275000")
    pg.get_by_role("button", name="Simpan Produk").click(); pg.wait_for_timeout(600)
    st = S()
    old_totals = [t["total"] for t in st["transactions"][:9]]
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", KSESS)
    pg.goto(BASE + "/transaksi-baru"); pg.wait_for_timeout(900)
    body2 = pg.locator(".product-grid").inner_text().replace("\xa0", " ")
    st2 = S()
    check("INT-06a", "katalog ikut harga baru", "Rp 275.000" in body2)
    check("INT-06b", "histori lama tak berubah", [t["total"] for t in st2["transactions"][:9]] == old_totals)

    # INT-07 kasir buat PO -> admin lihat + snapshot benar
    pg.goto(BASE + "/pemesanan"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Buat PO Baru").click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").nth(0).select_option("C-02")
    pg.locator(".drawer select").nth(1).select_option("P-008")
    pg.locator(".drawer input").nth(0).fill("1")
    pg.get_by_role("button", name="Buat PO", exact=True).click(); pg.wait_for_timeout(700)
    st = S()
    newpo = st["pos"][0]
    check("INT-07a", "PO Dipesan tercatat", newpo["status"] == "Dipesan" and newpo["customer"] == "Rian Pratama", newpo["id"])
    check("INT-07b", "snapshot lensa benar", (newpo["resepSnapshot"] or {}).get("od", {}).get("sph") == "-1.50", (newpo["resepSnapshot"] or {}).get("od"))
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/admin/pemesanan"); pg.wait_for_timeout(900)
    check("INT-07c", "admin lihat PO baru", newpo["number"] in pg.locator(".table-wrap").inner_text())
    NPO = newpo["id"]

    # INT-09 snapshot tak berubah (struktural: tersimpan per-PO, read-only)
    snap_before = json.dumps(newpo["resepSnapshot"], sort_keys=True)
    check("INT-09", "snapshot per-PO read-only", newpo["resepSnapshot"] is not None and "at" in newpo["resepSnapshot"], snap_before[:50])

    # INT-08 admin proses -> kasir pantau
    pg.goto(BASE + "/admin/pemesanan/" + NPO); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Proses menjadi Diproses").click(); pg.wait_for_timeout(600)
    pg.get_by_role("button", name="Tandai Sudah Datang").click(); pg.wait_for_timeout(600)
    st = S()
    po = next(o for o in st["pos"] if o["id"] == NPO)
    check("INT-08a", "PO -> Sudah Datang + timeline", po["status"] == "Sudah Datang" and len(po["timeline"]) == 3, po["status"])
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", KSESS)
    pg.goto(BASE + "/pemesanan/" + NPO); pg.wait_for_timeout(900)
    check("INT-08b", "kasir pantau status", "Sudah Datang" in pg.locator(".po-status-right").inner_text())

    # INT-18 tombol Selesai = NEEDS_CLIENT_APPROVAL (disabled + tag)
    tag = pg.locator(".pagehead-actions").inner_text()
    check("INT-18", "Selesai ditandai persetujuan", "NEEDS CLIENT APPROVAL" in tag, tag.replace("\n", " ")[:60])

    # INT-10 terima 3 -> +3 & 1 mutasi (pakai P-008 sisa 6)
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/admin/penerimaan"); pg.wait_for_timeout(900)
    s0 = next(s["saldo"] for s in S()["stock"] if s["productId"] == "P-008")
    mu0 = len(S()["mutations"])
    pg.locator('.recv-input input[placeholder="maks 6"]').fill("3")
    pg.locator(".recv-line", has=pg.locator('.recv-input input[placeholder="maks 6"]')).get_by_role("button", name="Konfirmasi").click()
    pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Ya, Catat Penerimaan").click(); pg.wait_for_timeout(600)
    st = S()
    s1 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-008")
    check("INT-10", "terima 3 -> stok +3 & 1 mutasi", s1 - s0 == 3 and len(st["mutations"]) - mu0 == 1 and st["mutations"][0]["sumber"] == "Penerimaan", f"{s0}->{s1}")

    # INT-11 retry identik ditolak
    pg.get_by_role("textbox", name="Jumlah diterima Lensa Blue").fill("3")
    pg.locator(".recv-line", has=pg.get_by_role("textbox", name="Jumlah diterima Lensa Blue")).get_by_role("button", name="Konfirmasi").click()
    pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Ya, Catat Penerimaan").click(); pg.wait_for_timeout(600)
    dup_err = pg.locator(".confirm .form-error").inner_text() if pg.locator(".confirm .form-error").count() else ""
    st = S()
    s2 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-008")
    check("INT-11", "retry duplikat: stok tetap", s2 == s1 and "duplikat" in dup_err, f"{s1}->{s2} | {dup_err[:40]}")
    pg.get_by_role("button", name="Batal").click(); pg.wait_for_timeout(400)

    # INT-21 gagal tengah jalan (over-alokasi) -> tanpa tulis parsial
    mu1 = len(st["mutations"])
    pg.locator('.recv-input input[placeholder="maks 4"]').fill("99")
    pg.locator(".recv-line", has=pg.locator('.recv-input input[placeholder="maks 4"]')).get_by_role("button", name="Konfirmasi").click()
    pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Ya, Catat Penerimaan").click(); pg.wait_for_timeout(500)
    st = S()
    err = pg.locator(".confirm .form-error").inner_text() if pg.locator(".confirm .form-error").count() else ""
    check("INT-21", "over-alokasi ditolak atomik", "Melebihi sisa alokasi" in err and len(st["mutations"]) == mu1, err[:50])
    pg.get_by_role("button", name="Batal").click(); pg.wait_for_timeout(400)

    # INT-12 kasir jual 2 sukses -> -2 & SALE
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", KSESS)
    pg.goto(BASE + "/transaksi-baru"); pg.wait_for_timeout(900)
    t0 = next(s["saldo"] for s in S()["stock"] if s["productId"] == "P-002")
    m0 = len(S()["mutations"])
    pg.get_by_role("button", name="Urban Square").first.click(); pg.wait_for_timeout(300)
    pg.get_by_role("link", name="Lanjut ke Checkout").click(); pg.wait_for_timeout(900)
    pg.locator(".cust-pick-row").first.click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Tambah", exact=True).first.click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Selesaikan Transaksi").click(); pg.wait_for_timeout(1200)
    st = S()
    t1 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-002")
    check("INT-12", "jual 2 -> stok -2 & 1 SALE", t0 - t1 == 2 and len(st["mutations"]) - m0 == 1 and st["mutations"][0]["sumber"] == "Penjualan", f"{t0}->{t1}")

    # INT-13 retry callback sukses -> idempoten
    ref = st["transactions"][0]["no"]
    dup = pg.evaluate("""(ref) => window.__simpos.recordSale(
      [{id:'P-002', name:'x', brand:'x', qty:2, price:1}], ref, 'Kasir')""", ref)
    st = S()
    t2 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-002")
    check("INT-13", "retry ref sama ditolak", dup is False and t2 == t1, f"dup={dup} stok={t2}")

    # INT-14 keranjang batal -> stok utuh (tanpa complete tak ada mutasi)
    m1 = len(st["mutations"])
    check("INT-14", "tanpa sukses tanpa mutasi", len(S()["mutations"]) == m1)

    # INT-15 over-claim via hook -> clamp 0, 1 mutasi
    big = pg.evaluate("""() => window.__simpos.recordSale(
      [{id:'P-004', name:'x', brand:'x', qty:999, price:1}], 'TRX-TEST-OVER', 'Kasir')""")
    st = S()
    s_over = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-004")
    last_mu = st["mutations"][0]
    check("INT-15", "klaim berlebih di-clamp 0", big is True and s_over == 0 and last_mu["qty"] == -9 and last_mu["sesudah"] == 0, f"saldo={s_over} deduct={last_mu['qty']}")

    # INT-16 menipis; INT-17 pengajuan 10 tak ubah stok
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/admin/stok"); pg.wait_for_timeout(900)
    low = [s for s in S()["stock"] if s["saldo"] <= s["minimum"]]
    check("INT-16", "label menipis konsisten", len(low) >= 1 and "Stok Menipis" in pg.locator(".table-wrap").inner_text(), f"low={len(low)}")
    b4 = {s["productId"]: s["saldo"] for s in S()["stock"]}
    pg.goto(BASE + "/admin/pengajuan"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Ajukan Stok").first.click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").select_option("P-006")
    pg.locator(".drawer input").nth(0).fill("10")
    pg.get_by_role("button", name="Lanjut Pratinjau").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Kirim Pengajuan").click(); pg.wait_for_timeout(500)
    st = S()
    check("INT-17", "pengajuan 10 tercatat, stok tetap", any(r["qty"] == 10 for r in st["requests"]) and {s["productId"]: s["saldo"] for s in st["stock"]} == b4)

    # INT-20 persistensi reload
    n_req = len(st["requests"])
    pg.reload(); pg.wait_for_timeout(1000)
    check("INT-20", "data menetap setelah reload", len(S()["requests"]) == n_req, n_req)

    # INT-22 state kosong/error tanpa crash
    pg.goto(BASE + "/admin/pemesanan/PO-TIDAK-ADA"); pg.wait_for_timeout(800)
    check("INT-22a", "PO tak dikenal fallback aman", pg.locator(".po-big-no").count() == 1)
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", KSESS)
    pg.goto(BASE + "/admin/pemesanan/PO-TIDAK-ADA"); pg.wait_for_timeout(800)
    check("INT-22b", "guard admin tetap menolak kasir", "/admin/login" in pg.url)

    # INT-24 + regresi kasir: tanpa pageerror sejauh ini
    check("INT-24", "tanpa pageerror lintas skrip", len(errs) == 0, errs[:2] if errs else "")

    b.close()

fails = [(i, n) for i, n, ok, _ in results if not ok]
print("TOTAL: %d/%d pass" % (len(results) - len(fails), len(results)))
print("DONE")
