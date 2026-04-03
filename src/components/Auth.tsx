import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";
import { Loader2, Mail, Lock, UserPlus, LogIn } from "lucide-react";

interface AuthProps {
  onSession: (session: any) => void;
}

export function Auth({ onSession }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) onSession(data.session);
        else alert("Verifique seu e-mail para confirmar o cadastro!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSession(data.session);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 luxury-card"
      >
        <div className="text-center mb-8">
          <img 
            src="input_file_0.png" 
            alt="Luana-Ju Logo" 
            className="h-24 w-auto mx-auto mb-4 object-contain"
            referrerPolicy="no-referrer"
          />
          <p className="text-zinc-500 text-sm italic">Exclusividade & Tecnologia</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary uppercase tracking-widest">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-primary uppercase tracking-widest">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full gold-bg text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
            {isSignUp ? "Criar Conta Premium" : "Acessar Plataforma"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-zinc-500 text-xs hover:text-primary transition-colors block w-full"
          >
            {isSignUp ? "Já possui conta? Entre aqui" : "Não tem conta? Solicite acesso"}
          </button>
          
          {!isSignUp && (
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                <span className="text-primary font-bold">DICA:</span> Se é sua primeira vez acessando, clique em <span className="text-primary font-bold">"Solicite acesso"</span> acima para criar sua conta de administrador.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
