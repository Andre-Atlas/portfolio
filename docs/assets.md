# Imagens e vídeos

Todos os visuais foram gerados no **Google Flow**: imagens com Nano Banana e vídeos com Omni 1.2 Flash, em 10 s e 16:9. Os arquivos-fonte (retratos, quadros-chave e versões descartadas) ficam em `assets-src/`, que **não** vai para o repositório. Aqui só entra o que o site usa, em `web/public/`.

## Regras de geração

- **Fundo:** verde chroma chapado (#00B140), sem chão, sombra, texto ou letterbox. O shader recorta o verde e converte tudo para cinza.
- **Robô:** um design original, masculino, com a construção à mostra (engrenagens, rolamentos, cabos, placas de circuito, articulações). Por baixo da placa do rosto, a cabeça é um núcleo mecânico com lentes de câmera, sem crânio humano. Personagens conhecidos serviram só de referência de clima.
- **Continuidade:** cada vídeo é gerado com o primeiro e o último quadro definidos. O primeiro quadro de um clipe é o último quadro salvo do clipe anterior ("Salvar frame" no editor do Flow), e é isso que faz as emendas casarem.
- **Revisão:** confira a linha do tempo de cada clipe no editor antes de usá-lo. O gerador às vezes troca o robô por um modelo liso e esguio; esses trechos precisam ser cortados.

## Preparar os vídeos

Baixe os clipes do Flow em 1080p e rode, da raiz do repositório:

```bash
tools/prep-clips.sh \
  "Robot_parts_separating_on_green_…_1080p.mp4:0-5.08" \
  "Robot_components_opening_up_…_1080p.mp4:3.3-9.96" \
  "Camera_orbiting_around_frozen_robot_…_1080p.mp4" \
  "Camera_orbiting_around_frozen_robot_…_1080p.mp4:rev" \
  "Robot_assembling_into_Vitruvian_…_1080p.mp4:0-6.5" \
  "Robot_holding_Vitruvian_pose_…_1080p.mp4:0-3.0"
```

Cada argumento é um arquivo, opcionalmente seguido de `:início-fim` (corte em segundos) e/ou `:rev` (tocar ao contrário). A ordem dos argumentos é a ordem na linha do tempo. A saída vai para `web/public/video/anatomy-1..N.mp4`, em 1920 px de largura, 24 fps, H.264 com CRF 20 e um quadro-chave a cada 4 quadros (para o seek do scrub ser rápido), sem áudio e com faststart. Dá para mudar com `WIDTH`, `CRF` e `GOP`.

Se você mudar a quantidade de clipes ou os cortes, ajuste em `web/src/components/Anatomy.tsx`:
- `CLIPS`, a lista de arquivos;
- `SHOTS[].f`, a posição de cada parada;
- `SEAMS`, as emendas que precisam de dissolução.

## Imagens

| Pasta | Conteúdo |
|---|---|
| `img/duality/robot.png`, `andre.png` | robô e retrato com fundo recortado, alinhados pelos olhos (cena 2) |
| `img/anatomy/*.png` | quadros-chave recortados, usados só se os vídeos faltarem |
| `img/covers/*.webp` | capas dos projetos em retrato 4:5: objetos de metal em estúdio, macro, fundo preto |

Recorte das imagens estáticas, com o ffmpeg do projeto:

```bash
web/node_modules/ffmpeg-static/ffmpeg -i quadro.png \
  -vf "chromakey=0x12A54D:0.16:0.06,despill=type=green,hue=s=0,scale=1600:-2" saida.png
```

## Figuras

As figuras dos blocos do Sobre vêm do pacote [`@lucasmarkes/hairline`](https://hairline.lucasmarkes.com) (MIT): `Relay`, `Terrain` e `Branches`. As cores seguem os tokens do tema, por meio das variáveis `--hairline-*` em `.about` no `styles.css`.
