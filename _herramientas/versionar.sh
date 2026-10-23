#!/usr/bin/env bash
# Sube la versión de caché (service worker) de cada app con cambios sin commit, para que los usuarios reciban lo nuevo.
# Si cambia un archivo compartido de la raíz (uso.js, apariencia.js, swipe-nav.js, wellness-soporte.js) sube todas.
# La carpeta _herramientas no se publica (GitHub Pages ignora las carpetas que empiezan con "_").
# Uso: bash _herramientas/versionar.sh
cd "$(git rev-parse --show-toplevel)" || exit 1
APPS="lumen powerfit mindfocus proyecta wellness-apps"
cambios=$( (git diff --name-only HEAD; git ls-files --others --exclude-standard) | sort -u)
sube=""
# se salta una app solo si su número de versión ya cambió (no basta con que sw.js tenga otros cambios)
for a in $APPS; do echo "$cambios" | grep -q "^$a/" && ! git diff HEAD -- "$a/sw.js" | grep -qE "^[+].*-v[0-9]+" && sube="$sube $a"; done
if echo "$cambios" | grep -qE '^(uso|apariencia|swipe-nav|wellness-soporte)\.js$'; then sube="$APPS"; fi
for a in $sube; do
  perl -0pi -e 's/(["\x27][a-z-]+-v)(\d+)(["\x27])/$1.($2+1).$3/e' "$a/sw.js"
  echo "$a: $(grep -oE "[\"'][a-z-]+-v[0-9]+[\"']" "$a/sw.js" | head -1)"
done
[ -z "$sube" ] && echo "Sin apps que versionar."
exit 0
