'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import { Activity, Brain, Shield, Zap, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ENGINE_URL = 'http://localhost:3100';

export default function AtlasDashboard() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoAlert, setAutoAlert] = useState<string | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('atlas_auth');
    if (!auth) {
      router.push('/login');
    }
  }, []);

  const fetchGraph = async () => {
    try {
      const { data } = await axios.get(`${ENGINE_URL}/graph`);
      
      setNodes((nds) => {
        return data.nodes.map((node: any, index: number) => {
          const existingNode = nds.find((n) => n.id === node.id);
          
          return {
            id: node.id,
            type: 'default',
            data: { label: node.label },
            position: existingNode ? existingNode.position : { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 },
            className: node.status === 'ERROR' ? 'animate-pulse' : '',
            style: { 
              background: node.status === 'ERROR' 
                ? 'radial-gradient(circle, #ef4444 0%, #7f1d1d 100%)' 
                : 'radial-gradient(circle, #22c55e 0%, #14532d 100%)',
              color: '#fff',
              borderRadius: '12px',
              width: 120,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              border: `2px solid ${node.status === 'ERROR' ? '#f87171' : '#4ade80'}`,
              boxShadow: `0 0 20px ${node.status === 'ERROR' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.2)'}`,
              opacity: 1
            }
          };
        });
      });

      const flowEdges = data.edges.map((edge: any) => ({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        animated: true,
        label: edge.lastStatus === 'ERROR' ? '⚠️ FAIL' : '',
        labelStyle: { fill: '#ef4444', fontWeight: 700, fontSize: 10 },
        style: { 
          stroke: edge.lastStatus === 'ERROR' ? '#ef4444' : '#334155',
          strokeWidth: edge.lastStatus === 'ERROR' ? 3 : 1,
          opacity: searchTerm ? 0.2 : 0.6
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: edge.lastStatus === 'ERROR' ? '#ef4444' : '#334155' }
      }));

      setEdges(flowEdges);

      // Se a IA enviou diagnóstico, exibe
      if (data.aiInsight) {
        setAiInsight(data.aiInsight);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchGraph();
    const interval = setInterval(fetchGraph, 5000);
    return () => clearInterval(interval);
  }, []);

  const manualAudit = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${ENGINE_URL}/analyze`);
      setAiInsight(data);
    } catch (err) {
      console.error('Audit error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
    const interval = setInterval(fetchGraph, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#05050a] text-slate-100 overflow-hidden font-sans">
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20"
          >
            <Activity size={24} />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              ATLAS-MAP
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Live Infrastructure Mesh</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-12 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar microserviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={manualAudit}
            disabled={loading}
            className="group relative flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity" />
            <Brain size={18} className={loading ? "animate-spin text-purple-600" : "text-purple-600"} />
            {loading ? 'Consulting Oracle...' : 'AI Oracle Audit'}
          </button>
        </div>
      </header>

      {/* Main Graph Area */}
      <main className="flex-1 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          colorMode="dark"
        >
          <Background color="#1e293b" gap={25} size={1} />
          <Controls className="bg-slate-800 border-white/5 fill-white" />
        </ReactFlow>

        {/* Floating Alertas/Insights */}
        <AnimatePresence>
          {(aiInsight || autoAlert) && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="absolute top-6 right-6 w-[450px] bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-purple-400">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Zap size={20} />
                  </div>
                  <h3 className="font-bold uppercase text-xs tracking-[0.2em]">IA Network Diagnostic</h3>
                </div>
                <button onClick={() => setAiInsight(null)} className="text-slate-500 hover:text-white transition-colors">
                  <RefreshCw size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {autoAlert && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-pulse">
                    <AlertTriangle size={18} className="shrink-0 mt-1" />
                    <p className="text-sm font-medium">{autoAlert}</p>
                  </div>
                )}
                
                {aiInsight && typeof aiInsight === 'object' ? (
                  <div className="space-y-4 text-xs font-mono">
                    {aiInsight.risks && (
                      <div>
                        <p className="text-red-400 font-bold mb-2 uppercase tracking-widest">Riscos Detectados:</p>
                        <ul className="space-y-1 list-disc list-inside text-slate-300">
                          {aiInsight.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    {aiInsight.recommendations && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-blue-400 font-bold mb-2 uppercase tracking-widest">Recomendações:</p>
                        <ul className="space-y-1 list-disc list-inside text-slate-300">
                          {aiInsight.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : aiInsight && (
                  <div className="text-slate-300 text-sm leading-relaxed font-mono whitespace-pre-wrap bg-black/20 p-4 rounded-2xl border border-white/5">
                    {aiInsight}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid Overlay */}
        <div className="absolute bottom-6 left-6 grid grid-cols-2 gap-4 pointer-events-none">
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total Nodes</p>
            <div className="text-2xl font-black">{nodes.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Active Edges</p>
            <div className="text-2xl font-black">{edges.length}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
