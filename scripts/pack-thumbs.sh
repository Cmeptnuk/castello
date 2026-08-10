#!/bin/bash
# Квадратные превью для плиток каталога.
#
# Промо-арты в Packs/ — широкие картинки 1382×768 под ~180 пикселей плитки:
# браузер тащил мегабайт JPEG и разворачивал его в 30 МБ пикселей, и на входе
# в каталог это чувствовалось. Здесь из каждого арта вырезается тот же кадр,
# что показывала плитка, и кладётся в thumb/ уже в нужном размере.
#
# Кадр берётся правее и выше центра: слева на арте текстовый блок с ценой,
# снизу — полоса «БЕЗОПАСНАЯ ОПЛАТА · 23.99 $». Сторона в 78% высоты
# поднимает нижнюю кромку над полосой, сдвиг в 84% уводит левую за текст.
#
# Запускать после того, как в Packs/ лёг новый арт:
#   ./scripts/pack-thumbs.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/public/ItemsCards/WithOutNitro/Packs"
out="$src/thumb"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$out"

for f in "$src"/*.jpg; do
  name="$(basename "$f" .jpg)"
  w="$(sips -g pixelWidth "$f" | awk '/pixelWidth/{print $2}')"
  h="$(sips -g pixelHeight "$f" | awk '/pixelHeight/{print $2}')"
  side=$(( h * 78 / 100 ))
  left=$(( (w - side) * 84 / 100 ))

  # sips правит файл на месте и не умеет читать из своего же --out, поэтому
  # кроп и уменьшение идут через копию во временной папке.
  cp "$f" "$tmp/work.jpg"
  sips -c "$side" "$side" --cropOffset 0 "$left" "$tmp/work.jpg" --out "$tmp/crop.jpg" > /dev/null
  sips -Z 400 -s formatOptions 72 "$tmp/crop.jpg" --out "$out/$name.jpg" > /dev/null

  printf '%-8s %s×%s → 400×400, %sK\n' "$name" "$w" "$h" "$(du -k "$out/$name.jpg" | cut -f1)"
done
