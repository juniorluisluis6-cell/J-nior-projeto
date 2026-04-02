import React, { useState, useEffect } from "react";
import { Chat } from "./components/Chat";
import { Rocket, Code, Layout, Smartphone, ChevronRight, Database, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || url === 'your-supabase-url' || !key || key === 'your-supabase-anon-key') {
      setIsConfigured(false);
    }
  }, []);

  useEffect(() => {
    if (showDashboard && isConfigured) {
      const fetchRequests = async () => {
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching requests:', error);
        } else {
          setRequests(data || []);
        }
      };
      fetchRequests();
    }
  }, [showDashboard, isConfigured]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Rocket className="w-6 h-6" />
            <span>Júnior Luis</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowDashboard(!showDashboard)}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors"
            >
              {showDashboard ? "Voltar ao Site" : "Dashboard Júnior"}
            </button>
          </div>
        </div>
      </nav>

      {showDashboard ? (
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Pedidos de Projetos</h1>
            {!isConfigured && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">Configure o Supabase no menu Settings</span>
              </div>
            )}
          </div>
          
          <div className="grid gap-6">
            {requests.length === 0 ? (
              <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500">
                  {isConfigured 
                    ? "Nenhum pedido recebido ainda." 
                    : "Configure o Supabase para visualizar os pedidos."}
                </p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{req.client_name}</h3>
                      <p className="text-sm text-zinc-500">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      Novo Pedido
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de App: {req.app_type}</p>
                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl max-h-40 overflow-y-auto text-xs font-mono">
                      {JSON.parse(req.chat_history).map((m: any, i: number) => (
                        <div key={i} className="mb-2">
                          <span className={m.role === "user" ? "text-blue-500" : "text-green-500"}>
                            {m.role === "user" ? "Cliente: " : "IA: "}
                          </span>
                          {m.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      ) : (
        <main>
          {/* Hero Section */}
          <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
            <div className="max-w-7xl mx-auto px-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium bg-primary/10 text-primary rounded-full">
                  Transformando Ideias em Código
                </span>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-8">
                  Criação de Aplicativos <br />
                  <span className="text-primary">Modernos e Lucrativos</span>
                </h1>
                <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
                  Desenvolvo soluções digitais personalizadas para o seu negócio. 
                  Do conceito ao lançamento, eu cuido de tudo.
                </p>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="group relative inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                >
                  Começar Projeto
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </div>
          </section>

          {/* Features */}
          <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { icon: Layout, title: "Websites", desc: "Landing pages e plataformas web de alta performance." },
                  { icon: Smartphone, title: "Apps Mobile", desc: "Aplicativos nativos e híbridos para iOS e Android." },
                  { icon: Database, title: "Sistemas", desc: "Dashboards e automações para otimizar seu negócio." },
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                      <item.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && <Chat onClose={() => setIsChatOpen(false)} />}
      </AnimatePresence>

      {/* Floating Chat Button (Mobile) */}
      {!isChatOpen && !showDashboard && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform z-30"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
