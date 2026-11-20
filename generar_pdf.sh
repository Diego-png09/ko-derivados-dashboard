#!/bin/zsh
# Genera dashboard/Presentacion_KO.pdf (las 8 pantallas) con Chrome sin interfaz.
# Requiere el sitio servido en local: (cd dashboard && python3 -m http.server 8765 --bind 127.0.0.1)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PERFIL="$(mktemp -d)"
"$CH" --headless=new --disable-gpu --window-size=1280,720 --virtual-time-budget=10000 \
  --user-data-dir="$PERFIL" --no-pdf-header-footer \
  --print-to-pdf="$DIR/Presentacion_KO.pdf" "http://127.0.0.1:8765/index.html?print=1"
rm -rf "$PERFIL"
