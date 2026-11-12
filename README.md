# André Acioli — portfólio

Portfólio interativo de **André Acioli**, AI Engineer e `< Software Developer />`. O conceito é a dualidade entre máquina e humano: um robô original e o retrato do André dividem a tela. Rolando a página, a máquina se desmonta em sua anatomia e se remonta como a *Machina Vitruviana*, que apresenta os projetos.

Preto e branco com subtons, nos temas claro e escuro, em PT e EN.

## Cenas

| # | Cena | O que acontece |
|---|---|---|
| 1 | **Entrada** | Um neurônio 3D ao estilo de um HUD (anéis girando como um giroscópio, elétrons no núcleo, traços de circuito) se monta enquanto carrega. O nome aparece letra a letra, seguido do botão **Entrar**. |
| 2 | **Dualidade** | O robô (à esquerda) e o André (à direita) ficam alinhados, separados por uma emenda que segue o cursor. O lado do robô acende "AI Engineer"; o do André, `< Software Developer />`. |
| 3 | **Sobre** | Um filme guiado pelo scroll, quadro a quadro: o rosto recua até o corpo inteiro, o robô se abre e as peças se afastam do endoesqueleto, a câmera orbita até a diagonal e as peças voltam enquanto ele assume a pose vitruviana. Cada parada traz um bloco de texto (quem sou, IA generativa, Machine Learning, engenharia de software) com uma figura interativa. |
| 4 | **Projetos** | A câmera orbita a Máquina Vitruviana até 3/4 e a gravura (círculo e quadrado) gira junto. Ao clicar em **Projetos**, a lista abre; no hover, a capa e o resumo de cada projeto aparecem num painel à esquerda. |
| 5 | **Contato** | E-mail, GitHub e LinkedIn. |

Da cena 2 em diante fica disponível o menu de 9 pontos (Home, Início, Sobre mim, Projetos, Contato), além do seletor PT/EN e do tema claro/escuro com ícones de sol e lua animados.

**Navegação:** com roda ou trackpad, o filme avança quadro a quadro; se você parar perto de uma cena, a página assenta nela suavemente. As setas ↓/↑, PageUp/PageDown e o espaço pulam uma cena por toque.

## Stack

- [Vite 8](https://vite.dev) + React 19 + TypeScript
- [three.js](https://threejs.org): neurônio (linhas com shader, sprites e bloom) e filme do robô (plano WebGL com chroma key)
- [GSAP ScrollTrigger](https://gsap.com/scrolltrigger/) + [Lenis](https://lenis.darkroom.engineering): scroll suave e scrub
- [Hairline](https://hairline.lucasmarkes.com) (MIT): figuras isométricas interativas dos blocos do Sobre
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

## Estrutura

```
web/
  index.html
  public/
    video/anatomy-1..6.mp4   filme da cena 3–4 (fundo verde, recortado no shader)
    img/duality/              robô e retrato recortados (cena 2)
    img/anatomy/              quadros estáticos de reserva, usados se os vídeos faltarem
    img/covers/               capas dos projetos
  src/
    App.tsx                   entrada, desbloqueio do scroll, montagem das cenas
    content.ts                todos os textos em PT/EN, projetos e contato
    lib/prefs.ts              tema e idioma (seguem o sistema; salvos no localStorage)
    lib/scroll.ts             Lenis + ScrollTrigger num só relógio
    components/
      Neuron.tsx              neurônio three.js da entrada
      Duality.tsx             cena 2, emenda guiada pelo cursor
      KeyedFilm.tsx           filme WebGL: chroma key, linha do tempo de clipes, dissoluções
      Anatomy.tsx             cenas 3–4: planos, paradas, snap, teclado, gravura, projetos
      Menu.tsx                menu, PT/EN, tema
      Contact.tsx             contato
    styles.css                tokens dos temas e estilos de todas as cenas
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
- **Figuras:** [Hairline](https://github.com/lucasmarkes/hairline), de Lucas Markes, licença MIT.
- **Código:** André Acioli.
