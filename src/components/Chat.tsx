import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { Send, User, Bot, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";

interface Message {
  role: "user" | "model";
  text: string;
}

interface ChatProps {
  onClose: () => void;
}

export function Chat({ onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with the required greeting
  useEffect(() => {
    setMessages([
      {
        role: "model",
        text: "Bem vindo a criançao de aplicativos de Júnior que tipo de aplicativos que tu queris par nos realizar",
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `Você é um assistente de vendas e levantamento de requisitos para Júnior, um desenvolvedor de aplicativos. 
          Seu objetivo é entender exatamente o que o cliente quer construir.
          Faça perguntas pertinentes sobre:
          1. Objetivo do aplicativo.
          2. Público-alvo.
          3. Funcionalidades principais.
          4. Design e estilo.
          5. Prazo desejado.
          
          Seja profissional, amigável e direto. 
          Sempre que sentir que tem informações suficientes, resuma o pedido e diga que Júnior entrará em contato em breve.
          
          IMPORTANTE: Ao final de cada interação, se o cliente der detalhes suficientes, envie uma cópia do resumo para o servidor (isso será feito automaticamente pelo código, você apenas deve confirmar o resumo).`,
        },
      });

      // Send history to maintain context
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...history, { role: "user", parts: [{ text: userMessage }] }],
      });

      const aiText = response.text || "Desculpe, tive um problema ao processar sua mensagem.";
      setMessages((prev) => [...prev, { role: "model", text: aiText }]);

      // Save to server if it looks like a summary or after a few messages
      if (messages.length > 3) {
        const { error } = await supabase
          .from('requests')
          .insert([
            {
              client_name: "Visitante",
              app_type: userMessage.substring(0, 50),
              chat_history: JSON.stringify([...messages, { role: "user", text: userMessage }, { role: "model", text: aiText }]),
            }
          ]);
        
        if (error) {
          console.error('Error saving to Supabase:', error);
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Houve um erro na conexão. Por favor, tente novamente." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Assistente Júnior</h2>
              <p className="text-xs text-zinc-500">Online agora</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-zinc-200 dark:bg-zinc-800" : "bg-primary/10 text-primary"
                )}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none"
                )}
              >
                <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 mr-auto">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-primary text-primary-foreground p-2 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
