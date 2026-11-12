# Arquitetura

Como funcionam o filme das cenas 3–4, as paradas e as transições. Os arquivos principais são `web/src/components/Anatomy.tsx` e `web/src/components/KeyedFilm.tsx`.

## Linha do tempo do filme

O filme é uma sequência de clipes curtos em `web/public/video/anatomy-N.mp4`, tocados como uma linha do tempo única. A **posição** `f` vai de 0 ao número de clipes: o clipe `i` ocupa o intervalo de `i` a `i + 1`, e cada número inteiro marca o encontro de dois clipes.

| Arquivo | Origem | Conteúdo |
|---|---|---|
| `anatomy-1` | "Robot parts separating on green", 0–5,08 s | o rosto recua até o corpo inteiro, fechado |
| `anatomy-2` | "Robot components opening up", 3,3 s até o fim | as placas se abrem e as peças se afastam do endoesqueleto |
| `anatomy-3` | "Camera orbiting around frozen robot" | órbita da frente até a diagonal, peças paradas no ar |
| `anatomy-4` | o mesmo clipe, invertido | órbita de volta para a frente |
| `anatomy-5` | "Robot assembling into Vitruvian…", 0–6,5 s | as peças voltam enquanto o robô assume a pose vitruviana |
| `anatomy-6` | "Robot holding Vitruvian pose", 0–3 s | órbita da Vitruviana até 3/4 |

Os cortes no início da abertura e no clipe da pose tiram alguns quadros em que o gerador trocou o robô por outro modelo.

## Planos, paradas e scroll

A seção `#anatomy` tem `HEIGHT_VH` (1100vh) de altura, com o palco fixo (`position: sticky`). O progresso do scroll, de 0 a 1, é convertido em três coisas:

1. **Espaço de planos `s`** (`KEYS`): a parada `i` fica em `s = i`. Os trechos planos de `KEYS` são as pausas, onde o quadro e o texto ficam parados.
2. **Posição do filme `f`** (`filmAt`): interpola `SHOTS[i].f` entre as paradas.
3. **Enquadramento** (`SHOTS[i].view`): zoom e deslocamento x/y do filme, interpolados entre as paradas.

| Parada | `f` | Texto | Lado |
|---|---|---|---|
| 0 | 0,86 | Quem sou eu | esquerda |
| 1 | 2 | IA generativa (figura Relay) | direita |
| 2 | 3 | Machine Learning (figura Terrain) | esquerda |
| 3 | 4,97 | Engenharia de software (figura Branches) + stack | direita |
| 4 | 6 | Projetos | direita |

**Texto:** cada bloco fica nítido na sua parada. Ao sair, desliza na direção do movimento da câmera (`dir`, `rot`), perde opacidade e ganha no máximo 3 px de desfoque. A figura Hairline do bloco roda sua animação (`play`) enquanto o plano está parado.

**Snap:** depois que a roda ou o trackpad param, o código espera `SNAP_DELAY` (420 ms). Se a página estiver a menos de `SNAP_REACH` (60% da altura da tela) de uma parada, ela assenta ali com uma desaceleração suave (`settleEase`). Mais longe que isso, a página fica onde está. Se um passo for interrompido sem interferência do usuário, ele retoma até o destino.

**Teclado:** ↓/↑, PageDown/PageUp e espaço levam de parada em parada. Cada toque vale um plano, e toques rápidos entram numa fila de até 4. Nas pontas, antes da intro e depois de Projetos, o teclado volta ao scroll normal. Os itens Sobre e Projetos do menu apontam para as âncoras dessas paradas.

**Gravura vitruviana:** é um SVG com círculo, quadrado e legenda. Ela se desenha (`stroke-dashoffset`) enquanto o robô chega à pose. Na órbita final gira em perspectiva (`rotateY`) junto com a máquina. O tamanho acompanha o quadro do filme (`PLATE_RATIO` × altura do quadro), em qualquer formato de tela.

**Lista de projetos:** ao abrir a lista, a câmera recua (`LIST_ZOOM`, `LIST_X`). Uma checagem de colisão compara o círculo da gravura com o painel de capas e recua mais, se for preciso. As linhas da lista têm altura fixa, então o hover não desloca nada. A capa e o resumo ficam num painel à esquerda da lista: a capa nova surge por cima da antiga, que continua opaca até ficar coberta, e os resumos se alternam em sequência.

## O filme em WebGL (`KeyedFilm.tsx`)

- **Chroma key:** os clipes são gerados em fundo verde chapado (#00B140). O shader recorta pela direção da cor em CbCr, o que remove também o verde na sombra. Depois corrói a borda em 1 px, tira o reflexo verde do metal e converte o resultado para cinza. Por isso o mesmo vídeo serve aos dois temas; no claro, `uInk` escurece um pouco o metal.
- **Seek sem quadros errados:** cada clipe registra o tempo do último quadro decodificado (evento `seeked`, com `requestVideoFrameCallback` como reforço). A textura só muda para um clipe quando o quadro dele bate com o tempo pedido; até lá, fica na tela o último quadro correto. Os clipes vizinhos ficam pré-posicionados nas emendas: o anterior no último quadro, o próximo no primeiro. O clipe que está na tela nunca é reposicionado.
- **Emendas que não casam** (`SEAMS`, hoje só a de `f = 1`): o quadro que sai fica opaco enquanto o próximo surge por cima com um leve desfoque, então o robô nunca fica transparente.
- **Reserva sem vídeo:** se os vídeos não estiverem publicados, o filme usa as imagens de `img/anatomy/` e troca entre elas com um desfoque, sem dupla exposição.
- **Diagnóstico** (só em desenvolvimento): defina `window.__filmLog = []` no console. A cada quadro, ele recebe a posição do quadro de fato exibido, o que permite conferir se o filme anda sempre no sentido do scroll.

## Celular (< 860 px)

A câmera fica mais próxima (`NARROW_ZOOM`) e o robô sobe para a metade de cima (`NARROW_Y`). Os textos viram cartões translúcidos embaixo. As figuras Hairline e o painel de capas ficam ocultos.

## Tema e idioma

`lib/prefs.ts` segue o tema e o idioma do sistema e salva a escolha do visitante em `localStorage` (`grid-theme`, `grid-lang`). O tema é aplicado como `data-theme` no `<html>`. O neurônio, o filme e as figuras observam essa troca e se ajustam na hora.
