# Imagens e vídeos

Todos os visuais foram gerados no **Google Flow**: imagens com Nano Banana e vídeos com Omni 1.2 Flash, em 10 s e 16:9. Os arquivos-fonte (retratos, quadros-chave e versões descartadas) ficam em `assets-src/`, que **não** vai para o repositório. Aqui só entra o que o site usa, em `web/public/`.

## Regras de geração

- **Fundo:** verde chroma chapado (#00B140), sem chão, sombra, texto ou letterbox. O shader recorta o verde e converte tudo para cinza.
- **Robô:** um design original, masculino, com a construção à mostra (engrenagens, rolamentos, cabos, placas de circuito, articulações). Por baixo da placa do rosto, a cabeça é um núcleo mecânico com lentes de câmera, sem crânio humano. Personagens conhecidos serviram só de referência de clima.
- **Pontas paradas:** cada vídeo é gerado com o primeiro e o último quadro definidos pelos quadros-chave de `assets-src/keyframes/video/`, e o prompt pede cerca de 0,5 s de quadro estável no começo e no fim. Assim o clipe começa e termina limpo.
- **Continuidade:** dentro de um trecho de filme, o quadro-chave final de um clipe é o inicial do seguinte. Entre trechos há um break, então não é preciso inventar uma ponte entre estados que não se ligam (como da explosão para a Vitruviana).
- **Anexar, não citar:** no agente do Flow, anexe os quadros-chave pelo seletor de mídia ("Incluir no comando"), de preferência numa sessão nova, e descreva o robô com uma ficha (ombros largos com engrenagens, peito plano e quadrado, abdômen exposto com placas de circuito). Quando os quadros são só citados pelo nome, o Omni trata a imagem como referência e redesenha o robô num modelo esguio, de peito liso, já no primeiro quadro.
- **Revisão:** confira a linha do tempo de cada clipe antes de usá-lo. O gerador às vezes troca o robô por um modelo liso e esguio. Um clipe assim é **gerado de novo**, nunca cortado.

## Preparar os vídeos

Baixe os clipes do Flow em 1080p e rode, da raiz do repositório:

```bash
tools/prep-clips.sh rosto-corpo.mp4 abertura.mp4 orbita.mp4 pose.mp4 orbita-vitruviana.mp4
```

Cada argumento é um arquivo, usado inteiro. A ordem dos argumentos é a ordem na linha do tempo. A opção `:início-fim` (corte em segundos) existe como ferramenta, mas não serve para remendar um clipe ruim. A saída vai para `web/public/video/anatomy-1..N.mp4`, em 1920 px de largura, 24 fps, H.264 com CRF 20 e um quadro-chave a cada 4 quadros (para o seek do scrub ser rápido), sem áudio e com faststart. Dá para mudar com `WIDTH`, `CRF` e `GOP`.

Se você mudar a quantidade de clipes ou os cortes, ajuste em `web/src/components/Anatomy.tsx`:
- `CLIPS`, a lista de arquivos;
- `SHOTS[].f`, a posição de cada parada, e `brk` nas paradas de break;
- `BUDGET`, o comprimento de scroll de cada parada.

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

As figuras foram criadas caso a caso com a skill `hairline-create` do [Hairline](https://hairline.lucasmarkes.com) (MIT), uma para cada lugar onde entram. Elas ficam em `web/src/figures/`. Veja a tabela e o modo de ajustar em [arquitetura.md](arquitetura.md#figuras-websrcfigures).
