import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Loader2, ArrowLeft, Image as ImageIcon, ExternalLink, Smartphone, Layout, Database, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface PortfolioItem {
  id: number;
  title: string;
  type: "Mobile" | "Web" | "System";
  description: string;
  image: string;
  created_at: string;
}

interface PortfolioProps {
  onBack: () => void;
  isAdmin: boolean;
}

export function Portfolio({ onBack, isAdmin }: PortfolioProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Mobile" | "Web" | "System">("Mobile");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setItems(data);
  };

  const deleteItem = async (id: number) => {
    if (!isAdmin) return;
    if (confirm("Tem certeza que deseja eliminar este trabalho?")) {
      const { error } = await supabase.from('portfolio').delete().eq('id', id);
      if (!error) fetchItems();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('portfolio').insert([
        { title, type, description, image }
      ]);

      if (error) throw error;
      
      setTitle("");
      setDescription("");
      setImage("");
      setIsAdding(false);
      fetchItems();
    } catch (err) {
      console.error("Error adding portfolio item:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-primary">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold gold-gradient" style={{ fontFamily: 'serif' }}>Portfólio de Luxo</h2>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="gold-bg text-black px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Plus size={18} /> Publicar Trabalho
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="luxury-card overflow-hidden group"
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-black px-2 py-1 rounded-full flex items-center gap-1">
                  {item.type === "Mobile" && <Smartphone size={10} />}
                  {item.type === "Web" && <Layout size={10} />}
                  {item.type === "System" && <Database size={10} />}
                  {item.type}
                </span>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="p-6 space-y-4">
              <h4 className="text-xl font-bold text-primary">{item.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 italic">
                "{item.description}"
              </p>
              <button className="w-full py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all">
                Ver Detalhes <ExternalLink size={14} />
              </button>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-24 text-zinc-500">
            Nenhum trabalho publicado ainda.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xl luxury-card p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold gold-gradient">Publicar Novo Trabalho</h3>
                <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase tracking-widest">Título</label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                      placeholder="Ex: Delivery Express"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase tracking-widest">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none appearance-none"
                    >
                      <option value="Mobile">Mobile</option>
                      <option value="Web">Web</option>
                      <option value="System">System</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest">URL da Imagem</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input
                      required
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary outline-none"
                      placeholder="https://imagem.com/foto.jpg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest">Descrição</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:border-primary outline-none h-32 resize-none"
                    placeholder="Descreva o projeto e os resultados..."
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full gold-bg text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Publicar no Portfólio"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
