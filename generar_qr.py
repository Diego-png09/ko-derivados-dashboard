"""Genera dashboard/qr.png con el enlace publicado del dashboard.
Uso: .venv/bin/python dashboard/generar_qr.py https://<usuario>.github.io/<repo>/
"""
import sys
from pathlib import Path
import qrcode

if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
    raise SystemExit("Uso: generar_qr.py https://...  (el enlace publicado)")
img = qrcode.make(sys.argv[1], error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=3)
out = Path(__file__).resolve().parent / "qr.png"
img.save(out)
print("ok", out, "→", sys.argv[1])
