const neo4j = require('neo4j-driver');
const Redis = require('ioredis');
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Neo4j Driver
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://neo4j:7687',
  neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'sentinel_atlas_pass')
);

// Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
});

// AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Worker to process traces from Redis to Neo4j
async function processTraces() {
  const session = driver.session();
  try {
    while (true) {
      const data = await redis.brpop('atlas_traces', 0);
      const trace = JSON.parse(data[1]);
      
      await session.run(
        `MERGE (s:Service {name: $source}) 
         MERGE (t:Service {name: $target}) 
         MERGE (s)-[r:CALLS]->(t) 
         SET r.lastStatus = $status, r.lastSeen = $timestamp, s.status = $status`,
        { ...trace }
      );
      console.log(`Processed trace: ${trace.source} -> ${trace.target}`);
    }
  } catch (err) {
    console.error('Worker error:', err);
  } finally {
    await session.close();
  }
}

// Start Server First
app.listen(3002, () => console.log('Atlas Engine running on port 3002'));

// Start worker in background
processTraces();

// API: Get Graph Data + AI Insight
app.get('/graph', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (s:Service)-[r:CALLS]->(t:Service) RETURN s, r, t'
    );
    
    const nodes = new Map();
    const edges = [];

    result.records.forEach(record => {
      const s = record.get('s').properties;
      const t = record.get('t').properties;
      const r = record.get('r').properties;

      nodes.set(s.name, { id: s.name, label: s.name, status: s.status });
      nodes.set(t.name, { id: t.name, label: t.name, status: t.status });
      edges.push({ source: s.name, target: t.name, ...r });
    });

    const graphData = { nodes: Array.from(nodes.values()), edges };
    
    // Diagnóstico Local de Backup
    const localAnalyze = (data) => {
      const risks = [];
      const recommendations = [];
      data.nodes.forEach(n => {
        if (n.status === 'ERROR') {
          risks.push(`Falha crítica detectada no serviço: ${n.id}`);
          recommendations.push(`Reiniciar container do ${n.id} e verificar logs de pânico.`);
        }
      });
      data.edges.forEach(e => {
        if (e.lastStatus === 'ERROR') {
          risks.push(`Erro de comunicação entre ${e.source} e ${e.target}`);
          recommendations.push(`Verificar regras de firewall e latência entre ${e.source} e ${e.target}.`);
        }
      });
      if (risks.length === 0) {
        risks.push("Nenhum risco imediato detectado na malha.");
        recommendations.push("Manter monitoramento ativo e logs de performance.");
      }
      return { risks: risks.slice(0, 5), recommendations: recommendations.slice(0, 5) };
    };

    let aiInsight = null;

    const hasError = graphData.nodes.some(n => n.status === 'ERROR') || 
                     graphData.edges.some(e => e.lastStatus === 'ERROR');
    
    if (hasError) {
      try {
        const key = process.env.GEMINI_API_KEY;
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
          {
            contents: [{
              parts: [{
                text: `Analise a seguinte topologia de microserviços e identifique riscos: ${JSON.stringify(graphData)}. Responda APENAS um JSON puro com os campos "risks" e "recommendations".`
              }]
            }]
          }
        );
        const aiText = response.data.candidates[0].content.parts[0].text;
        aiInsight = JSON.parse(aiText.replace(/```json|```/g, '').trim());
      } catch (e) {
        console.log('Gemini failed, using Local Diagnostic for background audit.');
        aiInsight = localAnalyze(graphData);
      }
    }

    res.json({ ...graphData, aiInsight });
  } finally {
    await session.close();
  }
});

app.get('/analyze', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('MATCH (s:Service)-[r:CALLS]->(t:Service) RETURN s, r, t');
    const nodes = new Map();
    const edges = [];
    result.records.forEach(record => {
      const s = record.get('s').properties;
      const t = record.get('t').properties;
      const r = record.get('r').properties;
      nodes.set(s.name, { id: s.name, label: s.name, status: s.status });
      nodes.set(t.name, { id: t.name, label: t.name, status: t.status });
      edges.push({ source: s.name, target: t.name, ...r });
    });

    const graphData = { nodes: Array.from(nodes.values()), edges };
    
    // Função de Diagnóstico Local (Backup Inteligente)
    const localAnalyze = (data) => {
      const risks = [];
      const recommendations = [];
      
      data.nodes.forEach(n => {
        if (n.status === 'ERROR') {
          risks.push(`Falha crítica detectada no serviço: ${n.id}`);
          recommendations.push(`Reiniciar container do ${n.id} e verificar logs de pânico.`);
        }
      });

      data.edges.forEach(e => {
        if (e.lastStatus === 'ERROR') {
          risks.push(`Erro de comunicação entre ${e.source} e ${e.target}`);
          recommendations.push(`Verificar regras de firewall e latência entre ${e.source} e ${e.target}.`);
        }
      });

      if (risks.length === 0) {
        risks.push("Nenhum risco imediato detectado na malha.");
        recommendations.push("Manter monitoramento ativo e logs de performance.");
      }

      return { risks: risks.slice(0, 5), recommendations: recommendations.slice(0, 5) };
    };

    try {
      const key = process.env.GEMINI_API_KEY;
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          contents: [{
            parts: [{
              text: `Analise a seguinte topologia de microserviços e identifique riscos: ${JSON.stringify(graphData)}. Responda APENAS um JSON puro com os campos "risks" e "recommendations".`
            }]
          }]
        }
      );
      const aiText = response.data.candidates[0].content.parts[0].text;
      const insight = JSON.parse(aiText.replace(/```json|```/g, '').trim());
      res.json(insight);
    } catch (e) {
      console.log('Gemini failed, using Local Diagnostic.');
      res.json(localAnalyze(graphData));
    }
  } finally {
    await session.close();
  }
});
