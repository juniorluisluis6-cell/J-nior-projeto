import React, { useState, useEffect } from "react";
import { Chat } from "./components/Chat";
import { ProjectForm, ProjectFormData } from "./components/ProjectForm";
import { Rocket, Code, Layout, Smartphone, ChevronRight, Database, MessageSquare, AlertCircle, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";
import { cn } from "./lib/utils";

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectData, setProjectData] = useState<ProjectFormData | undefined>();
  const [showDashboard, setShowDashboard] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || url.includes('your-supabase-url') || !key || key.includes('your-supabase-anon-key')) {
      setIsConfigured(false);
      setConnectionStatus('error');
      return;
    }

    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('requests').select('id').limit(1);
        if (error) throw error;
        setConnectionStatus('connected');
      } catch (err) {
        console.error('Supabase connection error:', err);
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    if (connectionStatus === 'connected') {
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

      const subscription = supabase
        .channel('requests_changes')
        .on('postgres_changes' as any, { event: '*', table: 'requests' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [connectionStatus]);

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
        <main className="h-[calc(100vh-64px)] flex flex-col bg-zinc-100 dark:bg-zinc-950">
          <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 overflow-x-auto flex items-center justify-between">
            <div className="flex gap-4 min-w-max px-2">
              {requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-24",
                    selectedRequestId === req.id 
                      ? "bg-primary/10 ring-2 ring-primary" 
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold relative">
                    {req.client_name.charAt(0)}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                  </div>
                  <span className="text-xs font-medium truncate w-full text-center">{req.client_name}</span>
                </button>
              ))}
              {requests.length === 0 && connectionStatus === 'connected' && (
                <div className="text-sm text-zinc-500 py-4">Aguardando novos pedidos...</div>
              )}
            </div>

            <div className="flex items-center gap-4 ml-4">
              {connectionStatus === 'connected' ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 text-xs font-bold">
                  <Check size={14} />
                  CONECTADO AO SUPABASE
                </div>
              ) : connectionStatus === 'error' ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 text-xs font-bold">
                  <AlertCircle size={14} />
                  ERRO DE CONEXÃO
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-200 text-xs font-bold">
                  <Loader2 size={14} className="animate-spin" />
                  VERIFICANDO...
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex overflow-hidden">
            {selectedRequestId ? (
              <div className="flex-1 flex flex-col bg-[#e5ddd5] dark:bg-zinc-950 relative">
                {/* WhatsApp Background Pattern (Optional) */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]" />
                
                <Chat 
                  requestId={selectedRequestId}
                  isAdmin={true}
                  onClose={() => setSelectedRequestId(null)}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                <MessageSquare size={64} className="mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">Selecione uma conversa</h2>
                <p>Escolha um cliente acima para começar a conversar.</p>
              </div>
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

      {/* Form Overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <ProjectForm 
            onClose={() => setIsFormOpen(false)} 
            onComplete={(data) => {
              setProjectData(data);
              setIsFormOpen(false);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <Chat 
            initialData={projectData}
            onOpenForm={() => setIsFormOpen(true)}
            onClose={() => {
              setIsChatOpen(false);
              setProjectData(undefined);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Floating Chat Button (Mobile) */}
      {!isChatOpen && !isFormOpen && !showDashboard && (
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
