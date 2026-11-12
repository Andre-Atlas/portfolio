# André Acioli — portfólio

Portfólio interativo de **André Acioli**, AI Engineer e `< Software Developer />`. O conceito é a dualidade entre máquina e humano: um robô original e o retrato do André dividem a tela. Rolando a página, a máquina se desmonta em sua anatomia e se remonta como a *Machina Vitruviana*, que apresenta os projetos.

Preto e branco com subtons, nos temas claro e escuro, em PT e EN.

**No ar:** https://andre-atlas.github.io/portfolio/

## Cenas

| # | Cena | O que acontece |
|---|---|---|
| 1 | **Entrada** | Um neurônio 3D ao estilo de um HUD (anéis girando como um giroscópio, elétrons no núcleo, traços de circuito) se monta enquanto carrega. O nome aparece letra a letra. A barra de carregamento acompanha o download real dos vídeos, retratos e capas, e só então o botão **Entrar** é liberado. Scroll e setas ficam bloqueados: só o botão passa da entrada. |
| 2 | **Dualidade** | O robô (à esquerda) e o André (à direita) ficam alinhados, separados por uma emenda que segue o cursor. O lado do robô acende "AI Engineer"; o do André, `< Software Developer />`. |
| 3 | **Sobre** | Um filme guiado pelo scroll, quadro a quadro: o rosto recua até o corpo inteiro, o robô se abre e as peças se afastam do endoesqueleto, e a câmera orbita até a diagonal (quem sou, IA generativa, Machine Learning). Um break, **Como eu trabalho**, tira o robô da tela; depois o robô inteiro assume a pose vitruviana (engenharia de software) e vem o break **Stack**. Cada parada tem uma figura interativa feita para ela. |
| 4 | **Projetos** | A câmera orbita a Máquina Vitruviana até 3/4 e a gravura (círculo e quadrado) gira junto. A lista de projetos abre sozinha quando o plano chega, pelo scroll, pelas setas ou pelo item Projetos do menu, e o título **Projetos** continua abrindo e fechando a lista; no hover, a capa e o resumo de cada projeto aparecem num painel à esquerda. |
| 5 | **Contato** | E-mail, GitHub e LinkedIn. |

Da cena 2 em diante fica disponível o menu de 9 pontos (Home, Início, Sobre mim, Projetos, Contato), além do seletor PT/EN e do tema claro/escuro com ícones de sol e lua animados.

**Navegação:** com roda ou trackpad, o filme avança quadro a quadro; se você parar perto de uma cena, a página assenta nela suavemente. As setas ↓/↑, PageUp/PageDown e o espaço pulam uma cena por toque, breaks incluídos.

## Stack

- [Vite 8](https://vite.dev) + React 19 + TypeScript
- [three.js](https://threejs.org): neurônio (linhas com shader, sprites e bloom) e filme do robô (plano WebGL com chroma key)
- [GSAP ScrollTrigger](https://gsap.com/scrolltrigger/) + [Lenis](https://lenis.darkroom.engineering): scroll suave e scrub
- [Hairline](https://hairline.lucasmarkes.com) (MIT): motor das figuras isométricas interativas, desenhadas caso a caso com a skill `hairline-create`
- Fontes: Instrument Serif, JetBrains Mono e Inter, via Fontsource
- `ffmpeg-static`: preparo dos vídeos

## Rodar localmente

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm run build      # gera web/dist
npm run preview    # serve o build
```

**Publicação:** cada push na `main` roda `.github/workflows/pages.yml`, que gera o build com a base `/portfolio/` e publica no GitHub Pages. Os arquivos públicos são referenciados por `asset()` (`web/src/lib/asset.ts`), então o site funciona tanto na raiz (localmente) quanto no subcaminho do Pages.

## Estrutura

```
web/
  index.html
  public/
    video/anatomy-1..5.mp4   filme da cena 3–4 (fundo verde, recortado no shader)
    img/duality/              robô e retrato recortados (cena 2)
    img/anatomy/              quadros estáticos de reserva, usados se os vídeos faltarem
    img/covers/               capas dos projetos
  src/
    App.tsx                   entrada, desbloqueio do scroll, montagem das cenas
    content.ts                todos os textos em PT/EN, projetos e contato
    lib/prefs.ts              tema e idioma (seguem o sistema; salvos no localStorage)
    lib/scroll.ts             Lenis + ScrollTrigger num só relógio
    lib/asset.ts              caminhos públicos relativos à base do Vite
    components/
      Neuron.tsx              neurônio three.js da entrada
      Duality.tsx             cena 2, emenda guiada pelo cursor
      KeyedFilm.tsx           filme WebGL: chroma key, linha do tempo de clipes, dissoluções
      Anatomy.tsx             cenas 3–4: planos, paradas, breaks, snap, teclado, gravura, projetos
      Menu.tsx                menu, PT/EN, tema
      Contact.tsx             contato
    figures/                  figuras Hairline do site (kernel.js, uma por parada, Figure.tsx)
    styles.css                tokens dos temas e estilos de todas as cenas

.github/workflows/pages.yml  build e publicação no GitHub Pages
tools/
  prep-clips.sh               recodifica os clipes do Flow para o scrub
docs/
  arquitetura.md              como o filme, as paradas e as transições funcionam
  assets.md                   como as imagens e os vídeos foram feitos e como refazê-los
```

## Editar o conteúdo

- **Textos:** ficam em `web/src/content.ts`. Cada texto tem `{ pt, en }`.
- **Novo projeto:** acrescente um item em `projects` (slug, título, tipo, resumo, stack, URL do repositório) e coloque a capa em `web/public/img/covers/<slug>.webp`, em retrato 4:5.
- **Cores e tipos:** os tokens `[data-theme=dark]` e `[data-theme=light]` ficam no topo de `web/src/styles.css`.

Detalhes técnicos em [docs/arquitetura.md](docs/arquitetura.md); produção de imagens e vídeos em [docs/assets.md](docs/assets.md).

## Créditos

- **Imagens e vídeos:** robô original e quadros gerados com Google Flow (Nano Banana e Omni) a partir de direção de arte própria. O robô é um design original; personagens conhecidos serviram só de referência de clima.
- **Figuras:** motor e skill [Hairline](https://github.com/lucasmarkes/hairline), de Lucas Markes, licença MIT; as cinco figuras foram desenhadas para este site.
- **Código:** André Acioli.
