# -*- coding: utf-8 -*-
"""Tulis ulang galeri index.html dari MANIFEST.json.

    python .\figma-kit-export\build_index.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(ROOT, "index.html")

with open(os.path.join(ROOT, "MANIFEST.json"), encoding="utf-8") as f:
    manifest = json.dumps(json.load(f), ensure_ascii=False, indent=2)

with open(INDEX, encoding="utf-8") as f:
    html = f.read()

html, n = re.subn(r"const MANIFEST = .*?;\nconst out", "const MANIFEST = " + manifest + ";\nconst out",
                  html, count=1, flags=re.S)

if n != 1:
    raise SystemExit("Gagal menemukan blok MANIFEST di index.html")

html = re.sub(r"<span class=\"pill\"><b>\d+</b> frame</span>",
              '<span class="pill"><b>%d</b> frame</span>' % len(json.loads(manifest)), html, count=1)

with open(INDEX, "w", encoding="utf-8") as f:
    f.write(html)

print("index.html diperbarui:", len(json.loads(manifest)), "frame")
