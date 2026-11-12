// Everything the visitor reads, in both languages. Sources: LinkedIn "About" and each repo's README.
// Add a project by appending to `projects`; its cover goes in /public/img/covers/<slug>.webp.

export type Lang = 'pt' | 'en'
type T = Record<Lang, string>

export type Project = {
  slug: string
  title: string
  kind: T
  summary: T
  stack: string[]
  repoUrl: string
  demoUrl?: string
}

export const person = {
  name: 'André Acioli',
  email: 'andrealvesacioli@gmail.com',
  links: {
    github: 'https://github.com/Andre-Atlas',
    linkedin: 'https://www.linkedin.com/in/andrealvesacioli/',
  },
}

export const ui = {
  enter: { pt: 'Entrar', en: 'Enter' },
  loading: { pt: 'Inicializando rede neural', en: 'Initializing neural network' },
  aiTitle: { pt: 'AI Engineer', en: 'AI Engineer' },
  aiLine: {
    pt: 'Modelos de linguagem, agentes e aprendizado de máquina para problemas reais.',
    en: 'Language models, agents and machine learning for real problems.',
  },
  devTitle: { pt: 'Software Developer', en: 'Software Developer' },
  devLine: {
    pt: 'Sistemas, APIs e dados que escalam, escritos com cuidado.',
    en: 'Systems, APIs and data that scale, written with care.',
  },
  hint: { pt: '← máquina · humano →', en: '← machine · human →' },
  menu: { pt: 'Menu', en: 'Menu' },
  close: { pt: 'Fechar', en: 'Close' },
  nav: {
    home: { pt: 'Home', en: 'Home' },
    start: { pt: 'Início', en: 'Start' },
    about: { pt: 'Sobre mim', en: 'About me' },
    projects: { pt: 'Projetos', en: 'Projects' },
    contact: { pt: 'Contato', en: 'Contact' },
  },
  theme: { pt: 'Alternar tema', en: 'Toggle theme' },
  language: { pt: 'Idioma', en: 'Language' },
  projects: { pt: 'Projetos', en: 'Projects' },
  openProjects: { pt: 'Ver projetos', en: 'See projects' },
  repo: { pt: 'Repositório', en: 'Repository' },
  demo: { pt: 'Demo', en: 'Demo' },
  contactTitle: { pt: 'Vamos conversar', en: "Let's talk" },
  contactLine: {
    pt: 'Aberto a oportunidades em AI Engineering, Machine Learning, Ciência de Dados e Engenharia de Software.',
    en: 'Open to opportunities in AI Engineering, Machine Learning, Data Science and Software Engineering.',
  },
}

export const about = {
  kicker: { pt: 'Anatomia', en: 'Anatomy' },
  title: { pt: 'Quem sou eu', en: 'Who I am' },
  intro: {
    pt: 'Estudante de Engenharia de Software na UCB e residente em IA no Instituto Eldorado, em parceria com a UnB. Trabalho onde a engenharia de IA, a ciência de dados e a arquitetura de software se encontram.',
    en: 'Software Engineering student at UCB and AI Resident at the Eldorado Institute, in partnership with UnB. I work where AI engineering, data science and software architecture meet.',
  },
  blocks: [
    {
      tag: 'LLM',
      figure: 'relay',
      title: { pt: 'IA generativa', en: 'Generative AI' },
      body: {
        pt: 'Pipelines de RAG, sistemas multiagente, busca semântica e embeddings. Modelos de linguagem que respondem com fonte e respeitam limites.',
        en: 'RAG pipelines, multi-agent systems, semantic search and embeddings. Language models that answer with sources and respect limits.',
      },
    },
    {
      tag: 'ML',
      figure: 'terrain',
      title: { pt: 'Machine Learning', en: 'Machine Learning' },
      body: {
        pt: 'Modelagem preditiva, fine-tuning e quantização de modelos para rodar na borda, com experimentos medidos e hipóteses que podem falhar.',
        en: 'Predictive modeling, fine-tuning and quantization of models to run on the edge, with measured experiments and hypotheses that can fail.',
      },
    },
    {
      tag: '</>',
      figure: 'branches',
      title: { pt: 'Engenharia de software', en: 'Software engineering' },
      body: {
        pt: 'APIs de alto desempenho, pipelines de dados escaláveis, bancos relacionais, NoSQL e vetoriais, contêineres e MLOps, com mascaramento de dados pessoais e conformidade com a LGPD.',
        en: 'High-performance APIs, scalable data pipelines, relational, NoSQL and vector databases, containers and MLOps, with PII masking and LGPD compliance.',
      },
    },
  ],
  stack: ['Python', 'SQL', 'Go', 'TypeScript', 'PyTorch', 'TensorFlow', 'scikit-learn', 'FastAPI', 'PostgreSQL · pgvector', 'MongoDB', 'Redis', 'Spark', 'Airflow', 'Docker'],
}

export const projects: Project[] = [
  {
    slug: 'susanna',
    title: 'SUSANNA',
    kind: { pt: 'RAG · Saúde pública', en: 'RAG · Public health' },
    summary: {
      pt: 'Assistente virtual da saúde pública do DF: RAG semântico, guardrail clínico que recusa diagnóstico e posologia, e 383 unidades de saúde mapeadas nas 33 regiões administrativas.',
      en: "Virtual assistant for the Federal District's public health system: semantic RAG, a clinical guardrail that refuses diagnosis and dosage, and 383 health units mapped across 33 regions.",
    },
    stack: ['FastAPI', 'ChromaDB', 'Ollama', 'Next.js', 'MLflow'],
    repoUrl: 'https://github.com/Andre-Atlas/SUSANNA-HEALTHCHECK',
    demoUrl: 'https://andre-atlas.github.io/SUSANNA-HEALTHCHECK/',
  },
  {
    slug: 'pandora',
    title: 'PANDORA',
    kind: { pt: 'Agentes · Finanças', en: 'Agents · Finance' },
    summary: {
      pt: 'Agentes de IA apoiados em evidências para ajudar pessoas endividadas ou com gastos compulsivos a recuperar o controle das finanças: raio-X das dívidas, guardião contra golpes e apostas, trilha de aprendizado.',
      en: 'Evidence-backed AI agents that help people in debt or with compulsive spending regain control of their finances: a debt X-ray, a guardian against scams and gambling, a learning path.',
    },
    stack: ['Python', 'Multiagente', 'Design system'],
    repoUrl: 'https://github.com/Andre-Atlas/PANDORA',
  },
  {
    slug: 'matrix',
    title: 'MATRIX',
    kind: { pt: 'LLMOps · Observabilidade', en: 'LLMOps · Observability' },
    summary: {
      pt: 'Plataforma de observabilidade para LLMs: traces OpenTelemetry/OpenInference, prompts versionados, datasets e experimentos de avaliação, e fila de anotação, num só lugar.',
      en: 'Observability platform for LLMs: OpenTelemetry/OpenInference traces, versioned prompts, evaluation datasets and experiments, and an annotation queue, all in one place.',
    },
    stack: ['FastAPI', 'ClickHouse', 'PostgreSQL', 'Next.js'],
    repoUrl: 'https://github.com/Andre-Atlas/MATRIX',
  },
  {
    slug: 'atlas',
    title: 'ATLAS',
    kind: { pt: 'Orquestração de agentes', en: 'Agent orchestration' },
    summary: {
      pt: 'Infraestrutura que rege agentes e skills de código: classifica cada pedido, escolhe fases e especialistas, monta o time e guarda dois portões de aprovação humana.',
      en: 'Infrastructure that conducts coding agents and skills: it classifies each request, picks phases and specialists, assembles the team and keeps two human approval gates.',
    },
    stack: ['Node.js', 'Claude Code', 'Antigravity'],
    repoUrl: 'https://github.com/Andre-Atlas/ATLAS',
  },
  {
    slug: 'edge-ai',
    title: 'Edge AI',
    kind: { pt: 'Pesquisa · Quantização', en: 'Research · Quantization' },
    summary: {
      pt: 'Artigo científico: quantização pós-treino (RTN, GPTQ, AWQ, K-quants) de LLMs de 0,6 a 4B num Apple M5 Pro, de 8 a 2 bits, com hipóteses pré-registradas e uma correção do GPTQ que eliminou os modelos inválidos.',
      en: 'Research paper: post-training quantization (RTN, GPTQ, AWQ, K-quants) of 0.6–4B LLMs on an Apple M5 Pro, from 8 to 2 bits, with pre-registered hypotheses and a GPTQ fix that eliminated invalid models.',
    },
    stack: ['MLX', 'llama.cpp', 'Python'],
    repoUrl: 'https://github.com/Andre-Atlas/edge-ai-quantization',
  },
]
