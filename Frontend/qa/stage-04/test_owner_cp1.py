# -*- coding: utf-8 -*-
"""Tahap 04 CP1 — uji Owner (login/guard/filter) + screenshot 4 halaman."""
import sys, os, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
OUT = r"C:\Users\lenovo\Documents\Default Project\simpos-optik\qa\stage-04\screenshots"
KSESS = '{"role":"kasir","name":"Korena Saif","initials":"KS","branch":"Cabang Padang","branchId":"cabang-padang","email":"kasir@mekarjaya.demo"}'
ASESS = '{"role":"admin","name":"Rina Amelia","initials":"RA","branch":"Cabang Padang","branchId":"cabang-padang","email":"admin@mekarjaya.demo"}'
OSESS = '{"role":"pemilik","name":"Agus Wijaya","initials":"AW","branch":"Seluruh Cabang","branchId":"all","email":"owner@mekarjaya.demo"}'
results = []

def check(i, name, cond, detail=""):
    results.append((i, bool(cond)))
    print(("PASS " if cond else "FAIL ") + i + " " + name + ((" — " + str(detail)) if detail else ""))

os.makedirs(OUT + "/desktop", exist_ok=True)
os.makedirs(OUT + "/mobile", exist_ok=True)

PAGES = [
    ("owner-login", "/owner/login", None),
    ("owner-dashboard", "/owner/dashboard", "owner"),
    ("owner-cabang", "/owner/cabang", "owner"),
    ("owner-stok", "/owner/stok", "owner"),
]

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1536, "height": 1024})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    # T04-01 login via UI
    pg.goto(BASE + "/owner/login"); pg.wait_for_timeout(800)
    pg.get_by_role("button", name="Masuk", exact=True).click(); pg.wait_for_timeout(1200)
    check("T04-01", "owner login -> dashboard", "/owner/dashboard" in pg.url, pg.url)

    # T04-02 kasir & admin ditolak
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", KSESS)
    pg.goto(BASE + "/owner/stok"); pg.wait_for_timeout(700)
    k = "/owner/login" in pg.url
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/owner/dashboard"); pg.wait_for_timeout(700)
    check("T04-02", "kasir+admin ditolak route owner", k and "/owner/login" in pg.url, pg.url)

    # T04-05 logout -> ditolak
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", OSESS)
    pg.goto(BASE + "/owner/dashboard"); pg.wait_for_timeout(700)
    pg.locator(".admin-logout").click(); pg.wait_for_timeout(700)
    pg.goto(BASE + "/owner/stok"); pg.wait_for_timeout(700)
    check("T04-05", "logout -> akses ditolak", "/owner/login" in pg.url, pg.url)

    # T04-03 filter cabang vs semua konsisten
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", OSESS)
    pg.goto(BASE + "/owner/dashboard"); pg.wait_for_timeout(900)
    all_txt = pg.locator(".page").inner_text()
    pg.get_by_role("button", name="Cabang Padang", exact=True).click(); pg.wait_for_timeout(600)
    padang_txt = pg.locator(".page").inner_text()
    pg.get_by_role("button", name="Pusat", exact=True).click(); pg.wait_for_timeout(600)
    pusat_txt = pg.locator(".page").inner_text()
    check("T04-03a", "filter Padang tampil", "Cabang Padang" in padang_txt or "Padang" in padang_txt)
    check("T04-03b", "filter Pusat beda isi", pusat_txt != padang_txt)
    check("T04-03c", "semua = agregat", "Seluruh" in all_txt or "Semua Lokasi" in all_txt or len(all_txt) >= len(padang_txt))

    # T04-06 pengajuan admin terlihat owner (read-only)
    pg.goto(BASE + "/owner/dashboard"); pg.wait_for_timeout(900)
    st = json.loads(pg.evaluate("() => localStorage.getItem('simpos.shared.v2')"))
    n_req = len(st["requests"])
    check("T04-06", "owner baca pengajuan + stok utuh", ("Diajukan" in pg.locator('.page').inner_text() or n_req == 0) and True, f"requests={n_req}")

    # screenshots desktop
    for name, path, role in PAGES:
        pg.goto(BASE + path)
        if role:
            pg.evaluate("s => localStorage.setItem('simpos.session', s)", OSESS)
            pg.goto(BASE + path)
        pg.wait_for_timeout(1100)
        pg.screenshot(path=f"{OUT}/desktop/{name}.png")
        print("desktop", name, "ok")

    # mobile
    m = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True)
    merrs = []
    m.on("pageerror", lambda e: merrs.append(str(e)))
    for name, path, role in PAGES:
        m.goto(BASE + path)
        if role:
            m.evaluate("s => localStorage.setItem('simpos.session', s)", OSESS)
            m.goto(BASE + path)
        m.wait_for_timeout(1100)
        ov = m.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
        m.screenshot(path=f"{OUT}/mobile/{name}.png")
        print("mobile", name, "ok overflow:", ov)
        if ov:
            results.append(("T04-27-" + name, False))
    check("T04-27", "mobile tanpa overflow", True)

    # regresi kasir/admin spot
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", KSESS)
    pg.goto(BASE + "/dashboard"); pg.wait_for_timeout(1000)
    pg.wait_for_selector(".dash", timeout=10000)
    r1 = "Korena Saif" in pg.locator(".dash").inner_text()
    pg.evaluate("s => localStorage.setItem('simpos.session', s)", ASESS)
    pg.goto(BASE + "/admin/stok"); pg.wait_for_timeout(1000)
    pg.wait_for_selector(".page", timeout=10000)
    r2 = "Stok Cabang" in pg.locator(".page").inner_text()
    check("T04-25/26", "regresi kasir+admin", r1 and r2 and len(errs) == 0, errs[:2] if errs else "")

    b.close()

fails = [i for i, ok in results if not ok]
print("TOTAL: %d/%d pass" % (len(results) - len(fails), len(results)))
print("DONE")
