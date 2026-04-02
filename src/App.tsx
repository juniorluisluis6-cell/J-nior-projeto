import React, { useState, useEffect } from "react";
import { Chat } from "./components/Chat";
import { ProjectForm, ProjectFormData } from "./components/ProjectForm";
import { Rocket, Code, Layout, Smartphone, ChevronRight, Database, MessageSquare, AlertCircle, Check, Loader2, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";
import { cn } from "./lib/utils";

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectData, setProjectData] = useState<ProjectFormData | undefined>();
  const [showDashboard, setShowDashboard] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    // Simple filtering logic
    let result = [...requests];
    
    if (searchTerm) {
      result = result.filter(r => 
        r.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.app_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType) {
      result = result.filter(r => r.app_type === filterType);
    }

    if (dateRange.start) {
      result = result.filter(r => new Date(r.created_at) >= new Date(dateRange.start));
    }

    if (dateRange.end) {
      result = result.filter(r => new Date(r.created_at) <= new Date(dateRange.end));
    }

    setFilteredRequests(result);
  }, [searchTerm, filterType, dateRange, requests]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password for demo/initial use. In production, use real Auth.
    if (adminPassword === "junior2024") {
      setIsAdminLoggedIn(true);
    } else {
      alert("Senha incorreta!");
    }
  };

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
        !isAdminLoggedIn ? (
          <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <Rocket size={32} />
                </div>
                <h2 className="text-2xl font-bold">Acesso Restrito</h2>
                <p className="text-zinc-500 text-sm">Apenas o Júnior Luis pode acessar esta área.</p>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="password"
                  placeholder="Senha de Acesso"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                />
                <button className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">
                  Entrar no Dashboard
                </button>
              </form>
              <button 
                onClick={() => setShowDashboard(false)}
                className="w-full mt-4 text-zinc-500 text-sm hover:underline"
              >
                Voltar ao Site
              </button>
            </motion.div>
          </div>
        ) : (
          <main className="h-[calc(100vh-64px)] flex flex-col bg-zinc-100 dark:bg-zinc-950">
            {/* Filters and Search */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4">
              <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px] relative">
                  <input
                    type="text"
                    placeholder="Buscar por cliente ou tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                  <MessageSquare size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Período:</span>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                  <span className="text-zinc-400">até</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  {connectionStatus === 'connected' ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 text-[10px] font-bold">
                      <Check size={12} />
                      CONECTADO
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 text-[10px] font-bold">
                      <AlertCircle size={12} />
                      ERRO
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setIsAdminLoggedIn(false);
                      setAdminPassword("");
                    }}
                    className="text-xs text-red-500 hover:underline font-bold"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal User List */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 overflow-x-auto">
              <div className="flex gap-4 min-w-max px-2">
                {filteredRequests.map((req) => (
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
                {filteredRequests.length === 0 && (
                  <div className="text-sm text-zinc-500 py-4">Nenhum resultado encontrado.</div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex overflow-hidden">
              {selectedRequestId ? (
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 flex flex-col bg-[#e5ddd5] dark:bg-zinc-950 relative">
                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]" />
                    <Chat 
                      requestId={selectedRequestId}
                      isAdmin={true}
                      onClose={() => setSelectedRequestId(null)}
                    />
                  </div>
                  
                  {/* Project Details Sidebar */}
                  <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-6 overflow-y-auto hidden lg:block">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <ClipboardList size={20} className="text-primary" />
                      Detalhes do Pedido
                    </h3>
                    
                    {requests.find(r => r.id === selectedRequestId) && (
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Cliente</label>
                          <p className="font-medium">{requests.find(r => r.id === selectedRequestId).client_name}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Tipo de App</label>
                          <p className="font-medium">{requests.find(r => r.id === selectedRequestId).app_type}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Preço Estimado</label>
                          <p className="text-green-600 font-bold">R$ {requests.find(r => r.id === selectedRequestId).service_price}</p>
                        </div>
                        {requests.find(r => r.id === selectedRequestId).logo_preference && (
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Preferência de Logo</label>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{requests.find(r => r.id === selectedRequestId).logo_preference}</p>
                          </div>
                        )}
                        {requests.find(r => r.id === selectedRequestId).service_photo && (
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Foto do Serviço</label>
                            <img 
                              src={requests.find(r => r.id === selectedRequestId).service_photo} 
                              alt="Serviço" 
                              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        {requests.find(r => r.id === selectedRequestId).logo_file && (
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Logo Enviado</label>
                            <img 
                              src={requests.find(r => r.id === selectedRequestId).logo_file} 
                              alt="Logo" 
                              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Data do Pedido</label>
                          <p className="text-xs">{new Date(requests.find(r => r.id === selectedRequestId).created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
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
        )
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
