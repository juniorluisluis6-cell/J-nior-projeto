import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Bot, 
  User, 
  Star, 
  Bell, 
  LayoutGrid, 
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { ProjectForm } from "./ProjectForm";
import { supabase } from "../lib/supabase";

interface DashboardProps {
  onSelect: (id: string) => void;
  isAdmin: boolean;
}

export function Dashboard({ onSelect, isAdmin }: DashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const menuItems = [
    { id: "chat", icon: MessageSquare, label: "Chat com Luana-Ju", desc: "Comunicação direta e exclusiva", color: "text-blue-500" },
    { id: "ai", icon: Bot, label: "Assistente IA", desc: "Dúvidas instantâneas com IA", color: "text-purple-500" },
    { id: "about", icon: User, label: "Sobre Mim", desc: "Conheça a trajetória da Luana-Ju", color: "text-amber-500" },
    { id: "reviews", icon: Star, label: "Avaliações", desc: "O que dizem os clientes premium", color: "text-yellow-500" },
    { id: "notifications", icon: Bell, label: "Notificações", desc: "Alertas e atualizações de projetos", color: "text-emerald-500" },
    { id: "portfolio", icon: LayoutGrid, label: "Portfólio", desc: "Galeria de projetos realizados", color: "text-primary" },
  ];

  const handleProjectComplete = async (data: any) => {
    try {
      const { error } = await supabase.from('requests').insert([
        {
          client_name: "Cliente Premium",
          app_type: data.appType,
          app_name: data.appName,
          logo_preference: data.logoPreference,
          logo_file: data.logoFile,
          service_photo: data.servicePhoto,
          service_price: data.servicePrice,
        }
      ]);

      if (error) throw error;
      
      setIsFormOpen(false);
      onSelect("chat");
    } catch (err) {
      console.error("Error saving project request:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-12">
      {/* Hero Branding */}
      <header className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em]"
        >
          <Sparkles size={12} />
          Exclusividade Digital
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-bold gold-gradient leading-tight" style={{ fontFamily: 'serif' }}>
          Bem-vindo à Experiência <br /> Luana-Ju
        </h1>
        <p className="text-zinc-500 max-w-xl mx-auto text-sm md:text-base italic">
          "Transformando visões ambiciosas em aplicativos de alto padrão, com design impecável e tecnologia de ponta."
        </p>
      </header>

      {/* Main Action */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-all" />
          <div className="space-y-4 relative z-10 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Pronto para elevar seu negócio?</h2>
            <p className="text-zinc-400 text-sm max-w-md">
              Inicie seu projeto exclusivo agora. A Luana-Ju cuidará de cada detalhe, do conceito à publicação.
            </p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="gold-bg text-black px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-primary/20 relative z-10"
          >
            <Plus size={24} /> Começar Projeto
          </button>
        </motion.div>
      )}

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(item.id)}
            className="luxury-card p-8 flex flex-col items-start text-left gap-6 group hover:border-primary/40 transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-lg`}>
              <item.icon size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{item.label}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
            <div className="pt-4 w-full flex justify-end">
              <ArrowRight size={20} className="text-zinc-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <ProjectForm 
            onClose={() => setIsFormOpen(false)} 
            onComplete={handleProjectComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
