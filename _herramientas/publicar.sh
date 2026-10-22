#!/usr/bin/env bash
# Publica los commits locales y espera a que el sitio en vivo sirva exactamente esos archivos.
# Compara cada archivo cambiado con lo que responde www.planificarproyectos.com (sin caché), revisando cada 5 s,
# todos a la vez, hasta 4 minutos. Termina en cuanto todos coinciden.
# Uso: bash _herramientas/publicar.sh        (o con --solo-verificar para no hacer push)
cd "$(git rev-parse --show-toplevel)" || exit 1
SITIO="https://www.planificarproyectos.com"
git fetch -q origin main
archivos=$(git diff --name-only origin/main..HEAD | grep -v '^_herramientas/')
if [ "$1" != "--solo-verificar" ]; then
  [ -z "$(git log --oneline origin/main..HEAD)" ] && { echo "No hay commits por publicar."; exit 0; }
  git push -q origin HEAD:main || { echo "Falló el push."; exit 1; }
  echo "Push hecho: $(git log -1 --format=%h)"
else
  archivos=$(git diff --name-only HEAD~1..HEAD | grep -v '^_herramientas/')
fi
[ -z "$archivos" ] && { echo "Sin archivos del sitio que verificar."; exit 0; }
inicio=$(date +%s)
while :; do
  faltan=""
  for f in $archivos; do
    [ -f "$f" ] || continue
    esp=$(git show "HEAD:$f" | sha1sum | cut -c1-40)
    vivo=$(curl -s --max-time 15 "$SITIO/$f?nocache=$RANDOM$RANDOM" | sha1sum | cut -c1-40)
    [ "$esp" = "$vivo" ] || faltan="$faltan $f"
  done
  [ -z "$faltan" ] && { echo "En vivo ($(( $(date +%s)-inicio )) s): $(echo $archivos | wc -w) archivo(s) iguales al commit."; exit 0; }
  [ $(( $(date +%s)-inicio )) -ge 240 ] && { echo "Aún no coinciden tras 4 min:$faltan"; exit 2; }
  sleep 5
done
