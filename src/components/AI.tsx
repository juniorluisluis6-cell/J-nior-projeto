import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, Loader2, ArrowLeft, Trash2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  text: string;
}

interface AIProps {
  onBack: () => void;
}

export function AI({ onBack }: AIProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Olá! Sou o assistente inteligente da Luana-Ju. Como posso ajudar você hoje com a criação do seu aplicativo premium?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...history, { role: "user", parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: `Você é o assistente inteligente da Luana-Ju, uma desenvolvedora de aplicativos de luxo.
          
          REGRAS:
          1. Seu tom deve ser extremamente profissional, elegante e prestativo.
          2. Você deve explicar os serviços da Luana-Ju: Criação de Apps Mobile, Web e Sistemas.
          3. Se o cliente perguntar sobre preços, diga que os projetos são personalizados e exclusivos, e sugira que ele fale diretamente com a Luana-Ju no chat.
          4. Se o cliente quiser começar um projeto, explique que a Luana-Ju cuida de tudo, desde o design até o lançamento.
          5. Use emojis de luxo como 💎, ✨, 🚀, 📱.`,
        }
      });

      const aiText = response.text || "Desculpe, tive um problema ao processar sua solicitação.";
      setMessages(prev => [...prev, { role: "model", text: aiText }]);
    } catch (error) {
      console.error("AI error:", error);
      setMessages(prev => [...prev, { role: "model", text: "Erro ao conectar com a inteligência artificial. Tente novamente mais tarde." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-primary">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold gold-gradient" style={{ fontFamily: 'serif' }}>Assistente IA</h2>
              <p className="text-[10px] text-zinc-500">Inteligência Artificial Ativa</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: "model", text: "Olá! Sou o assistente inteligente da Luana-Ju. Como posso ajudar você hoje?" }])}
          className="p-2 text-zinc-700 hover:text-primary transition-colors"
          title="Limpar Conversa"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 p-4 luxury-card scrollbar-hide"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl space-y-2 ${
              msg.role === "user" 
                ? "bg-primary text-black font-medium rounded-tr-none" 
                : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none"
            }`}>
              <div className="markdown-body prose prose-invert prose-xs">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-xs text-zinc-500 italic">Processando inteligência...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua dúvida sobre criação de apps..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-6 pr-14 py-4 text-sm focus:border-primary outline-none shadow-2xl"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
}
