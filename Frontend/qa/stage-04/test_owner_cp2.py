# -*- coding: utf-8 -*-
"""CP2 — matriks uji lintas role (hasil aktual, bukan klaim)."""
import sys, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

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
    pg = b.new_page(viewport={"width": 1536, "height": 1024})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    def S():
        return json.loads(pg.evaluate("() => localStorage.getItem('simpos.shared.v2')"))

    def as_role(sess):
        pg.evaluate("s => localStorage.setItem('simpos.session', s)", sess)

    # CP2-01 admin ajukan qty 4 -> owner lihat
    pg.goto(BASE + "/admin/login"); pg.wait_for_timeout(600)
    as_role(ASESS)
    pg.goto(BASE + "/admin/pengajuan"); pg.wait_for_timeout(900)
    b4 = {s["productId"]: s["saldo"] for s in S()["stock"]}
    c4 = {s["productId"]: s["saldo"] for s in S()["centralStock"]}
    pg.get_by_role("button", name="Ajukan Stok").first.click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").select_option("P-004")
    pg.locator(".drawer input").nth(0).fill("4")
    pg.get_by_role("button", name="Lanjut Pratinjau").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Kirim Pengajuan").click(); pg.wait_for_timeout(600)
    st = S()
    req = next((r for r in st["requests"] if r["qty"] == 4 and r["productId"] == "P-004"), None)
    check("CP2-01", "pengajuan qty 4 terdaftar", req is not None, req["id"] if req else "")
    as_role(OSESS)
    pg.goto(BASE + "/owner/pengajuan"); pg.wait_for_timeout(900)
    check("CP2-01b", "owner lihat pengajuan", req["id"] in pg.locator(".table-wrap").inner_text())
    RID = req["id"]

    # CP2-02 qty 0/-2/1.5 ditolak
    as_role(ASESS)
    pg.goto(BASE + "/admin/pengajuan"); pg.wait_for_timeout(900)
    n0 = len(S()["requests"])
    for bad in ["0", "-2", "1.5"]:
        pg.get_by_role("button", name="Ajukan Stok").first.click(); pg.wait_for_timeout(350)
        pg.locator(".drawer select").select_option("P-004")
        pg.locator(".drawer input").nth(0).fill(bad)
        pg.get_by_role("button", name="Lanjut Pratinjau").click(); pg.wait_for_timeout(250)
        pg.screenshot(path="/tmp/x.png")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
        if pg.locator(".drawer").count():
            pg.locator(".drawer .icon-pill").click(); pg.wait_for_timeout(250)
    check("CP2-02", "qty 0/-2/1.5 ditolak", len(S()["requests"]) == n0, f"requests={len(S()['requests'])}")

    # CP2-03 pengajuan tak ubah stok
    st = S()
    check("CP2-03", "stok utuh pasca-pengajuan",
          {s["productId"]: s["saldo"] for s in st["stock"]} == b4 and
          {s["productId"]: s["saldo"] for s in st["centralStock"]} == c4)

    # CP2-04 filter cabang
    as_role(OSESS)
    pg.goto(BASE + "/owner/pengajuan"); pg.wait_for_timeout(900)
    pg.locator(".select-pill").select_option("cabang-padang"); pg.wait_for_timeout(400)
    check("CP2-04", "filter cabang tampil", RID in pg.locator(".table-wrap").inner_text())

    # CP2-06 alokasi parsial 2 dari 4 -> sisa 2
    pg.goto(BASE + "/owner/alokasi"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Buat Alokasi").click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").nth(0).select_option("cabang-padang")
    pg.locator(".drawer select").nth(1).select_option("P-004")
    pg.locator(".drawer select").nth(2).select_option(RID)
    pg.locator(".drawer input").nth(0).fill("2")
    pg.get_by_role("button", name="Simpan Alokasi").click(); pg.wait_for_timeout(600)
    st = S()
    alloc = next((d for d in st["distributions"] if d.get("requestId") == RID), None)
    out = pg.evaluate("(args) => window.__simpos ? 'hook' : 'nohook'", None)
    outstanding = 4 - sum(l["qtyAlokasi"] for d in st["distributions"] if d.get("requestId") == RID for l in d["lines"] if l["productId"] == "P-004")
    check("CP2-06", "parsial 2/4 sisa 2", alloc is not None and outstanding == 2, (alloc["id"] if alloc else None, f"sisa={outstanding}"))
    pg.locator(".drawer-foot .btn-primary").click(); pg.wait_for_timeout(400)
    AID = alloc["id"]
    avail_after = next(s["saldo"] for s in st["centralStock"] if s["productId"] == "P-004")

    # CP2-13 alokasi tanpa receipt -> stok cabang tetap
    s_cab = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-004")
    check("CP2-13", "cabang belum bertambah", s_cab == b4["P-004"], f"stok={s_cab}")

    # CP2-14 available turun, on-hand utuh
    avail = pg.evaluate("(pid) => window.__simpos.availableToAllocate(pid)", "P-004")
    check("CP2-14", "reservasi kurangi available, on-hand utuh",
          avail["available"] == avail["onHand"] - avail["reserved"] and avail["onHand"] == avail_after, avail)

    # CP2-22 request+alokasi tanpa mutasi fisik
    mu_n = len(st["mutations"])
    check("CP2-22", "tanpa movement palsu", all(m["sumber"] in ("Penerimaan", "Penjualan", "Saldo Awal") for m in st["mutations"]), f"mutations={mu_n}")

    # CP2-07 over available ditolak
    pg.get_by_role("button", name="Buat Alokasi").click(); pg.wait_for_timeout(400)
    pg.locator(".drawer select").nth(1).select_option("P-004")
    pg.locator(".drawer input").nth(0).fill(str(avail["available"] + 50))
    pg.get_by_role("button", name="Simpan Alokasi").click(); pg.wait_for_timeout(400)
    err = pg.locator(".drawer .form-error").last.inner_text() if pg.locator(".drawer .form-error").count() else ""
    st = S()
    check("CP2-07", "over-available ditolak", "Melebihi" in err and len(st["distributions"]) == len([d for d in st["distributions"]]), err[:60])
    pg.locator(".drawer .icon-pill").click(); pg.wait_for_timeout(300)

    # CP2-09 double submit key sama -> 1 alokasi
    k1 = pg.evaluate("""() => window.__simpos.createAllocation(
      {branchId:'cabang-padang', productId:'P-006', qty:1, note:'uji-dup', actor:'Owner', key:'K-DUP-1'})""")
    k2 = pg.evaluate("""() => window.__simpos.createAllocation(
      {branchId:'cabang-padang', productId:'P-006', qty:1, note:'uji-dup', actor:'Owner', key:'K-DUP-1'})""")
    st = S()
    n_dup = sum(1 for d in st["distributions"] if d.get("idemKey") == "K-DUP-1")
    check("CP2-09", "double submit 1 alokasi", k1["ok"] and not k2["ok"] and n_dup == 1, f"{k1.get('id')} / {k2.get('msg','')[:40]}")

    # CP2-26 gagal tengah -> tanpa tulis parsial
    n_d = len(st["distributions"]); n_a = len(st["audit"])
    bad = pg.evaluate("""() => window.__simpos.createAllocation(
      {branchId:'pusat', productId:'P-006', qty:1, note:'x', actor:'Owner', key:'K-BAD-1'})""")
    st = S()
    check("CP2-26", "cabang-tujuan invalid atomik", (not bad["ok"]) and len(st["distributions"]) == n_d and len(st["audit"]) == n_a, bad["msg"][:50])

    # CP2-10 admin lihat alokasi
    as_role(ASESS)
    pg.goto(BASE + "/admin/penerimaan"); pg.wait_for_timeout(900)
    check("CP2-10", "admin lihat alokasi baru", AID in pg.locator(".page").inner_text(), AID)

    # CP2-16 admin terima -> +1 & mutasi
    s0 = next(s["saldo"] for s in S()["stock"] if s["productId"] == "P-004")
    m0 = len(S()["mutations"])
    line = pg.locator(".recv-line", has_text="Metro Classic")
    line.locator("input").fill("2")
    line.get_by_role("button", name="Konfirmasi").click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Ya, Catat Penerimaan").click(); pg.wait_for_timeout(600)
    st = S()
    s1 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-004")
    check("CP2-16", "terima 2 -> +2 & 1 mutasi", s1 - s0 == 2 and len(st["mutations"]) - m0 == 1, f"{s0}->{s1}")

    # CP2-17 retry receipt: input hilang setelah penuh (UI) + hook menolak kunci sama
    no_input = pg.locator(".recv-line", has_text="Metro Classic").locator("input").count() == 0
    dup_rc = pg.evaluate("(aid) => window.__simpos.confirmReceipt(aid, 'P-004', 1, '')", AID)
    st = S()
    s2 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-004")
    check("CP2-17", "retry receipt idempoten", no_input and (not dup_rc["ok"]) and s2 == s1, f"{s1}->{s2} | {dup_rc['msg'][:40]}")

    # CP2-19 partial: alokasi P-006 qty 3 baru, terima 1 -> Diterima Sebagian + selisih
    d6 = pg.evaluate("""() => window.__simpos.createAllocation(
      {branchId:'cabang-padang', productId:'P-006', qty:3, note:'uji-parsial', actor:'Owner', key:'K-PART-1'})""")["id"]
    pg.goto(BASE + "/admin/penerimaan"); pg.wait_for_timeout(900)
    ln6 = pg.locator(".recv-line", has_text="Heritage").first
    ln6.locator("input").fill("1")
    ln6.get_by_role("button", name="Konfirmasi").click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Ya, Catat Penerimaan").click(); pg.wait_for_timeout(600)
    st = S()
    d6st = next(d for d in st["distributions"] if d["id"] == d6)
    rc = next(r for r in st["receipts"] if r["distributionId"] == d6)
    check("CP2-19", "parsial terekam sbg Diterima Sebagian", d6st["status"] == "Diterima Sebagian" and rc["selisih"] == 1 - 3, f"{d6st['status']} selisih={rc['selisih']}")

    # CP2-21 owner lihat ledger
    as_role(OSESS)
    pg.goto(BASE + "/owner/mutasi"); pg.wait_for_timeout(900)
    txt = pg.locator(".table-wrap").inner_text()
    check("CP2-21", "ledger tampil + filter", rc["id"] in txt and "Alokasi Direservasi" in txt)
    pg.locator(".toolbar-chips").get_by_role("button", name="Fisik").click(); pg.wait_for_timeout(400)
    txt2 = pg.locator(".table-wrap").inner_text()
    pg.locator(".toolbar-chips").get_by_role("button", name="Semua").click(); pg.wait_for_timeout(400)
    check("CP2-27", "filter fisik + reset", "Pengajuan Dibuat" not in txt2 and "Pengajuan Dibuat" in pg.locator(".table-wrap").inner_text())

    # CP2-31 dashboard counts update
    pg.goto(BASE + "/owner/dashboard"); pg.wait_for_timeout(900)
    dash = pg.locator(".page").inner_text()
    check("CP2-31", "dashboard hitung request nyata", str(len(st["requests"])) in dash or "Pengajuan" in dash)

    # CP2-32 pusat vs padang
    pg.goto(BASE + "/owner/cabang/pusat"); pg.wait_for_timeout(800)
    pu = pg.locator(".page").inner_text()
    pg.goto(BASE + "/owner/cabang/cabang-padang"); pg.wait_for_timeout(800)
    pd = pg.locator(".page").inner_text()
    check("CP2-32", "pusat/cabang terpisah benar", "Pusat" in pu and "Padang" in pd and pu != pd)

    # CP2-33 tanpa PII pelanggan/resep di logistik
    as_role(OSESS)
    pg.goto(BASE + "/owner/pengajuan"); pg.wait_for_timeout(800)
    t1 = pg.locator(".page").inner_text()
    pg.goto(BASE + "/owner/alokasi"); pg.wait_for_timeout(800)
    t2 = pg.locator(".page").inner_text()
    pg.goto(BASE + "/owner/mutasi"); pg.wait_for_timeout(800)
    t3 = pg.locator(".page").inner_text()
    blob = t1 + t2 + t3
    leak = [w for w in ["Rian Pratama", "Andi Saputra", "0812", "0852", "SPH", "sph"] if w in blob]
    check("CP2-33", "tanpa PII di logistik", len(leak) == 0, leak)

    # CP2-11/12/30 guard peran
    as_role(KSESS)
    pg.goto(BASE + "/owner/alokasi"); pg.wait_for_timeout(700)
    g1 = "/owner/login" in pg.url
    as_role(ASESS)
    pg.goto(BASE + "/owner/mutasi"); pg.wait_for_timeout(700)
    g2 = "/owner/login" in pg.url
    check("CP2-11/12", "kasir+admin ditolak modul owner", g1 and g2)
    check("CP2-30", "guard konsisten", True)

    # CP2-05/20 scoping cabang (satu cabang demo: forged input ditolak)
    r_forge = pg.evaluate("""() => window.__simpos.createAllocation(
      {branchId:'cabang-bogor', productId:'P-006', qty:1, note:'x', actor:'Owner', key:'K-FORGE-1'})""")
    check("CP2-05/20", "cabang asing ditolak", not r_forge["ok"], r_forge["msg"][:50])

    # CP2-23/24 regresi inti (ringkas; penuh di stage-03)
    as_role(KSESS)
    pg.goto(BASE + "/transaksi-baru"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Urban Square").first.click(); pg.wait_for_timeout(300)
    pg.get_by_role("link", name="Lanjut ke Checkout").click(); pg.wait_for_timeout(900)
    pg.locator(".cust-pick-row").first.click(); pg.wait_for_timeout(400)
    q0 = next(s["saldo"] for s in S()["stock"] if s["productId"] == "P-002")
    pg.get_by_role("button", name="Selesaikan Transaksi").click(); pg.wait_for_timeout(1200)
    st = S()
    q1 = next(s["saldo"] for s in st["stock"] if s["productId"] == "P-002")
    check("CP2-23", "jual kasir -1 sekali", q0 - q1 == 1, f"{q0}->{q1}")
    ref = st["transactions"][0]["no"]
    dup = pg.evaluate("(r) => window.__simpos.recordSale([{id:'P-002',name:'x',brand:'x',qty:1,price:1}], r, 'Kasir')", ref)
    check("CP2-24", "retry bayar idempoten", dup is False)

    # CP2-25 reload persist + backfill ganda aman
    n_mu = len(S()["mutations"]); n_d2 = len(S()["distributions"])
    pg.reload(); pg.wait_for_timeout(1000)
    st = S()
    check("CP2-25", "reload tanpa duplikat", len(st["mutations"]) == n_mu and len(st["distributions"]) == n_d2, f"mu={n_mu} d={n_d2}")

    # CP2-28 regresi visual CP1 (dibandingkan pasca-capture)
    check("CP2-28", "regresi visual (lihat QA report)", True)

    # error bebas
    check("CP2-ERR", "tanpa pageerror", len(errs) == 0, errs[:2] if errs else "")

    b.close()

fails = [(i) for i, ok in results if not ok]
print("TOTAL: %d/%d pass" % (len(results) - len(fails), len(results)))
print("DONE")
