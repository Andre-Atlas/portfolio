#!/bin/zsh
# Re-encode Flow clips for scroll scrubbing (a keyframe every few frames, no audio), in timeline
# order. Clips are used whole: each one starts and ends on a still frame, so none needs trimming.
#   clip.mp4            whole clip (the normal case)
#   clip.mp4:0-5.0      only seconds 0 to 5.0 (kept as a tool, not for patching a bad clip)
# Output: web/public/video/anatomy-1..N.mp4
# Env: WIDTH (1920), CRF (20), GOP (4 frames between keyframes; small so scrubbing seeks stay fast)
set -e
cd "$(dirname "$0")/.."
FF=web/node_modules/ffmpeg-static/ffmpeg
mkdir -p web/public/video
rm -f web/public/video/anatomy-*.mp4(N)
i=1
for arg in "$@"; do
  src=${arg%%:*}
  opts=${arg#$src}
  trim=() vf="fps=24,scale=${WIDTH:-1920}:-2:flags=lanczos"
  [[ $opts == :*-* ]] && trim=(-ss ${${opts#:}%-*} -to ${opts#*-})
  "$FF" -y -loglevel error $trim -i "$src" -an -vf "$vf" -c:v libx264 -preset slow -tune film -crf ${CRF:-20} -g ${GOP:-4} -bf 0 -pix_fmt yuv420p -movflags +faststart "web/public/video/anatomy-$i.mp4"
  echo "anatomy-$i.mp4 <- $arg"
  i=$((i + 1))
done
ls -la web/public/video
