# 🛰️ ATLAS-MAP: AI-Driven Infrastructure Mesh

**Atlas-Map** é uma plataforma de observabilidade de próxima geração que utiliza **Grafos (Neo4j)**, **Mensageria Real-time (Redis)** e **Inteligência Artificial (Gemini/Local)** para mapear e diagnosticar a saúde de arquiteturas de microserviços em tempo real.

![Status](https://img.shields.io/badge/Status-Demo--Ready-green) ![AI](https://img.shields.io/badge/AI-Oracle--Integrated-purple)

---

## 💎 O Diferencial
Ao contrário de ferramentas de logs tradicionais, o Atlas-Map entende a **topologia** da rede. Ele não apenas diz "o serviço X caiu", ele mostra o efeito dominó, identifica o gargalo original e sugere uma solução via **AI Oracle**.

## 🚀 Tech Stack
- **Frontend:** Next.js 14, React Flow, Tailwind CSS, Framer Motion.
- **Engine:** Node.js (Express), Neo4j (Graph DB), ioredis.
- **Ingestion:** Fastify (Collector), Python (Simulator).
- **Infra:** Docker & Docker Compose.
- **Intelligence:** Google Gemini 1.5 Flash + Local Heuristic Diagnostic Fallback.

---

## 🏗️ Arquitetura do Sistema

1.  **Ingestão:** O `Collector` recebe rastros de comunicação (traces) e joga em uma fila de alta velocidade no `Redis`.
2.  **Processamento:** O `Engine` consome a fila e atualiza a topologia no `Neo4j` em tempo real.
3.  **Visualização:** O `Dashboard` renderiza a malha usando `React Flow`, destacando falhas em vermelho.
4.  **Diagnóstico:** Ao detectar erros, o `AI Oracle` (ou o Analista Local) processa a topologia e gera um relatório de riscos e recomendações.

---

## 🛠️ Como Rodar

### Pré-requisitos
- Docker & Docker Compose instalados.

### Passo a Passo
1.  **Configuração:** Crie um arquivo `.env` na raiz:
    ```env
    GEMINI_API_KEY=sua_chave_aqui
    NEO4J_URI=bolt://neo4j:7687
    NEO4J_USER=neo4j
    NEO4J_PASSWORD=password
    REDIS_HOST=redis
    REDIS_PORT=6379
    ```

2.  **Build & Run:**
    ```bash
    docker-compose up -d --build
    ```

3.  **Acesso:**
    - Dashboard: `http://localhost:3003`
    - Neo4j Browser: `http://localhost:7474` (User: neo4j / Pass: password)

---

## 🧠 AI Oracle & Local Diagnostic
O Atlas-Map possui um sistema de inteligência híbrido:
- **Modo Oracle:** Utiliza modelos LLM para análise comportamental da infraestrutura.
- **Modo Resiliente:** Se a API de IA estiver fora, um motor heurístico local assume a análise baseada em padrões de falha detectados no Grafo.

---

## 📈 Roadmap de Evolução
- [ ] **Persistência de Layout:** Salvar as posições dos nós no Neo4j para manter o design customizado pelo usuário.
- [ ] **Integração OpenTelemetry:** Suporte nativo ao protocolo OTLP para ingestão de dados reais de mercado.
- [ ] **Alerting:** Notificações via Slack/Discord ao detectar anomalias críticas via IA.

---

**Desenvolvido Por: Wilson Borges.**
