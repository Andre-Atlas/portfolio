# Arquitetura

Como funcionam o filme das cenas 3–4, as paradas, os breaks e as figuras. Os arquivos principais são `web/src/components/Anatomy.tsx`, `web/src/components/KeyedFilm.tsx` e `web/src/figures/`.

## Linha do tempo do filme

O filme é uma sequência de 5 clipes curtos em `web/public/video/anatomy-N.mp4`, tocados como uma linha do tempo única. A **posição** `f` vai de 0 a 5: o clipe `i` ocupa o intervalo de `i` a `i + 1`.

Todo clipe é usado inteiro: começa e termina num quadro parado. Não há cortes, clipe invertido nem dissolução entre clipes.

| Arquivo | Do quadro → ao quadro | Conteúdo |
|---|---|---|
| `anatomy-1` | rosto → corpo inteiro | a câmera recua; o robô segue fechado |
| `anatomy-2` | corpo inteiro → explodido de frente | as placas se abrem e as peças se afastam do endoesqueleto |
| `anatomy-3` | explodido de frente → explodido em diagonal | órbita, peças paradas no ar |
| `anatomy-4` | corpo inteiro → Vitruviana de frente | os braços sobem e o segundo par de membros se abre |
| `anatomy-5` | Vitruviana de frente → Vitruviana 3/4 | órbita |

Os clipes 1–3 formam um trecho contínuo: cada um começa no quadro em que o anterior termina. O clipe 4 começa de novo num robô inteiro, e a passagem do clipe 3 para o 4 acontece num **break**, com o filme fora da tela. Por isso não existe uma transição forçada da explosão para a Vitruviana.

## Planos, paradas e scroll

A seção `#anatomy` tem `HEIGHT_VH` de altura, com o palco fixo (`position: sticky`). O progresso do scroll, de 0 a 1, é convertido em três coisas:

1. **Espaço de planos `s`** (`KEYS`): a parada `i` fica em `s = i`. `KEYS` e `RESTS` saem de `BUDGET`, que dá a cada parada uma entrada e uma pausa, em vh.
2. **Posição do filme `f`** (`filmAt`): interpola `SHOTS[i].f` entre as paradas.
3. **Enquadramento** (`SHOTS[i].view`): zoom e deslocamento x/y do filme, interpolados entre as paradas.

| Parada | `f` | Tela | Lado do texto |
|---|---|---|---|
| 0 | 0,995 | Quem sou eu | esquerda |
| 1 | 1,995 | IA generativa (figura Binders) | direita |
| 2 | 2,995 | Machine Learning (figura Weights) | esquerda |
| 3 | 3 | **Break: Como eu trabalho** (figura Caliper) | centro |
| 4 | 3,995 | Engenharia de software (figura Containers) | direita |
| 5 | 4 | **Break: Stack** (figura Trays) | centro |
| 6 | 5 | Projetos | direita |

As paradas no fim de um clipe ficam em `x,995`, porque o número inteiro pertence ao clipe seguinte.

**Breaks:** `filmFade` tira o filme da tela perto de uma parada de break. O filme some com um leve desfoque, o texto do break entra centralizado e a posição atravessa a fronteira entre os trechos sem que ninguém veja. Na saída, o clipe seguinte espera no primeiro quadro até o filme voltar (`filmAt` só começa a tocar depois de 42% do caminho) e então toca.

**Texto:** cada bloco fica nítido na sua parada. Ao sair, desliza na direção do movimento da câmera (`dir`, `rot`), perde opacidade e ganha no máximo 3 px de desfoque. A figura do bloco roda sua animação (`play`) enquanto o plano está parado.

**Snap:** depois que a roda ou o trackpad param, o código espera `SNAP_DELAY` (420 ms). Se a página estiver a menos de `SNAP_REACH` (60% da altura da tela) de uma parada, ela assenta ali com uma desaceleração suave (`settleEase`). Mais longe que isso, a página fica onde está. Se um passo for interrompido sem interferência do usuário, ele retoma até o destino.

**Teclado:** ↓/↑, PageDown/PageUp e espaço levam de parada em parada, breaks incluídos. Cada toque vale um plano, e toques rápidos entram numa fila de até 4. Nas pontas, antes da intro e depois de Projetos, o teclado volta ao scroll normal. Os itens Sobre e Projetos do menu apontam para as âncoras dessas paradas.

**Gravura vitruviana:** é um SVG com círculo, quadrado e legenda. Ela se desenha (`stroke-dashoffset`) enquanto o robô chega à pose (fim do clipe 4), some no break da Stack junto com o filme e, na órbita final, gira em perspectiva (`rotateY`) junto com a máquina. O tamanho acompanha o quadro do filme (`PLATE_RATIO` × altura do quadro), em qualquer formato de tela.

**Lista de projetos:** ao abrir a lista, a câmera recua (`LIST_ZOOM`, `LIST_X`). Uma checagem de colisão compara o círculo da gravura com o painel de capas e recua mais, se for preciso. As linhas da lista têm altura fixa, então o hover não desloca nada. A capa e o resumo ficam num painel à esquerda da lista: a capa nova surge por cima da antiga, que continua opaca até ficar coberta, e os resumos se alternam em sequência.

## O filme em WebGL (`KeyedFilm.tsx`)

- **Chroma key:** os clipes são gerados em fundo verde chapado (#00B140). O shader recorta pela direção da cor em CbCr, o que remove também o verde na sombra. Depois corrói a borda em 1 px, tira o reflexo verde do metal e converte o resultado para cinza. Por isso o mesmo vídeo serve aos dois temas; no claro, `uInk` escurece um pouco o metal.
- **Seek sem quadros errados:** cada clipe registra o tempo do último quadro decodificado (evento `seeked`, com `requestVideoFrameCallback` como reforço). A textura só muda para um clipe quando o quadro dele bate com o tempo pedido; até lá, fica na tela o último quadro correto. Os clipes vizinhos ficam pré-posicionados: o anterior no último quadro, o próximo no primeiro. O clipe que está na tela nunca é reposicionado.
- **Fade** (`fade`, de 0 a 1): multiplica a imagem e acrescenta desfoque enquanto ela some. É o que esconde o filme nos breaks.
- **Reserva sem vídeo:** se os vídeos não estiverem publicados, o filme usa as imagens de `img/anatomy/` (uma por parada) e troca entre elas com um desfoque, sem dupla exposição.
- **Diagnóstico** (só em desenvolvimento): defina `window.__filmLog = []` no console. A cada quadro, ele recebe a posição do quadro de fato exibido, o que permite conferir se o filme anda sempre no sentido do scroll.

## Figuras (`web/src/figures/`)

Cada figura foi desenhada para o lugar onde entra, com a skill `hairline-create` do [Hairline](https://github.com/lucasmarkes/hairline), e passou pelas checagens da própria skill (`look.mjs`): enquadramento, leitura, console, tremor e resposta visível em miniatura.

| Arquivo | Onde | O objeto | O que o cursor faz | Leitura |
|---|---|---|---|---|
| `binders.js` | IA generativa | prateleira de fichários, as fontes | puxa o fichário para fora da fileira, como uma fonte citada | `ref 05` |
| `weights.js` | Machine Learning | placa de pinos, uma matriz de pesos | perto do cursor, os pinos se encaixam em poucos níveis (quantização) | `w 3·2 · 3lv` |
| `containers.js` | Engenharia de software | contêineres sob um pórtico | o guindaste ergue um contêiner sem mexer nos outros | `svc 03` |
| `caliper.js` | Como eu trabalho | paquímetro fechado numa peça | abre a garra, que para na peça | `66.7 mm` |
| `trays.js` | Stack | pilha de bandejas: infra, dados, ML, linguagens | as bandejas acima da escolhida sobem e mostram as ferramentas | `data · 5` |

- `kernel.js` é o motor do Hairline como a skill o distribui, sem alteração. `Figure.tsx` avalia o motor e cada figura como estão escritos, como faz a página da skill, e monta a figura do mesmo jeito que o pacote.
- As cores vêm dos tokens `--hairline-*`, definidos em `.about` no `styles.css`, então as figuras acompanham os dois temas.
- `play` faz um cursor invisível percorrer o `tour` da figura enquanto a parada dela está ativa. Com `prefers-reduced-motion`, a figura fica parada.

Para criar ou ajustar uma figura, instale a skill (`npx skills add lucasmarkes/hairline`), edite só o `.js` da figura e rode, numa pasta de trabalho:

```bash
node .agents/skills/hairline-create/look.mjs binders.js --answer 66,44,25
```

## Celular (< 860 px)

A câmera fica mais próxima (`NARROW_ZOOM`) e o robô sobe para a metade de cima (`NARROW_Y`). Os textos viram cartões translúcidos embaixo. As figuras dos blocos e o painel de capas ficam ocultos. Os breaks viram um cartão centralizado, com a figura menor.

## Tema e idioma

`lib/prefs.ts` segue o tema e o idioma do sistema e salva a escolha do visitante em `localStorage` (`grid-theme`, `grid-lang`). O tema é aplicado como `data-theme` no `<html>`. O neurônio, o filme e as figuras observam essa troca e se ajustam na hora.
