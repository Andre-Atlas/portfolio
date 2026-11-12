#!/bin/zsh
# Re-encode Flow clips for scroll scrubbing (every frame a keyframe, no audio), in timeline order.
# Each argument is a file, optionally followed by options after a colon:
#   clip.mp4            whole clip
#   clip.mp4:0-5.0      only seconds 0 to 5.0
#   clip.mp4:rev        played backwards (also combinable: clip.mp4:2-8:rev)
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
  for o in ${(s/:/)opts}; do
    if [[ $o == rev ]]; then vf="$vf,reverse"
    elif [[ $o == *-* ]]; then trim=(-ss ${o%-*} -to ${o#*-})
    fi
  done
  "$FF" -y -loglevel error $trim -i "$src" -an -vf "$vf" -c:v libx264 -preset slow -tune film -crf ${CRF:-20} -g ${GOP:-4} -bf 0 -pix_fmt yuv420p -movflags +faststart "web/public/video/anatomy-$i.mp4"
  echo "anatomy-$i.mp4 <- $arg"
  i=$((i + 1))
done
ls -la web/public/video
