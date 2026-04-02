import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { Send, User, Bot, Loader2, X, Check, CheckCheck, Menu, Plus, LayoutGrid, ClipboardList, MessageCircle, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { ProjectFormData } from "./ProjectForm";
import { PastProjects } from "./PastProjects";

interface Message {
  role: "user" | "model" | "admin";
  text: string;
  timestamp?: string;
}

interface ChatProps {
  onClose: () => void;
  initialData?: ProjectFormData;
  requestId?: number;
  isAdmin?: boolean;
  onOpenForm?: () => void;
}

export function Chat({ onClose, initialData, requestId, isAdmin = false, onOpenForm }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<number | undefined>(requestId);
  const [showMenu, setShowMenu] = useState(false);
  const [showPastProjects, setShowPastProjects] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages if requestId is provided
  useEffect(() => {
    if (requestId) {
      const fetchChat = async () => {
        const { data, error } = await supabase
          .from('requests')
          .select('chat_history')
          .eq('id', requestId)
          .single();
        
        if (data?.chat_history) {
          setMessages(JSON.parse(data.chat_history));
        }
      };
      fetchChat();

      const channel = supabase
        .channel(`chat_${requestId}`)
        .on('postgres_changes' as any, { 
          event: 'UPDATE', 
          table: 'requests', 
          filter: `id=eq.${requestId}` 
        }, (payload: any) => {
          if (payload.new.chat_history) {
            const newHistory = JSON.parse(payload.new.chat_history);
            setMessages(newHistory);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [requestId]);

  // Initial greeting for new clients
  useEffect(() => {
    if (!requestId && !isAdmin) {
      const greeting = "Olá! Bem-vindo ao suporte do Júnior Luis. Como posso ajudar você hoje?";
      
      if (initialData) {
        setMessages([
          { role: "model", text: greeting, timestamp: new Date().toISOString() },
          { 
            role: "user", 
            text: `Eu quero um aplicativo do tipo: ${initialData.appType}. O nome será ${initialData.appName}. Sobre o logo: ${initialData.logoPreference}. O preço do meu serviço é R$ ${initialData.servicePrice}.`,
            timestamp: new Date().toISOString()
          },
          { 
            role: "model", 
            text: `Excelente! Já anotei os detalhes iniciais do seu projeto "${initialData.appName}". Como você deseja um aplicativo de ${initialData.appType}, vou te fazer algumas perguntas específicas para entendermos melhor as funcionalidades necessárias. Vamos lá?`,
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        setMessages([
          { 
            role: "model", 
            text: greeting, 
            timestamp: new Date().toISOString() 
          },
          {
            role: "model",
            text: "Escolha uma das opções no menu abaixo para começarmos.",
            timestamp: new Date().toISOString()
          }
        ]);
        setShowMenu(true);
      }
    }
  }, [initialData, requestId, isAdmin]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveHistory = async (newHistory: Message[]) => {
    const payload = {
      client_name: initialData?.appName || "Visitante",
      app_type: initialData?.appType || "Consulta",
      chat_history: JSON.stringify(newHistory),
      service_photo: initialData?.servicePhoto,
      service_price: initialData?.servicePrice,
      logo_file: initialData?.logoFile,
      logo_preference: initialData?.logoPreference
    };

    if (currentRequestId || requestId) {
      const id = requestId || currentRequestId;
      await supabase.from('requests').update({ chat_history: JSON.stringify(newHistory) }).eq('id', id);
    } else {
      const { data, error } = await supabase.from('requests').insert([payload]).select().single();
      if (data) setCurrentRequestId(data.id);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    const timestamp = new Date().toISOString();
    const newMessages: Message[] = [...messages, { role: isAdmin ? "admin" : "user", text: userMessage, timestamp }];
    
    setInput("");
    setMessages(newMessages);
    setShowMenu(false);
    
    if (isAdmin) {
      await saveHistory(newMessages);
      return;
    }

    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const history = messages.map(m => ({
        role: m.role === "admin" ? "model" : m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...history, { role: "user", parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: `Você é um assistente de vendas para Júnior Luis. 
          
          REGRAS IMPORTANTES:
          1. O aplicativo está conectado à nuvem (Supabase) e todas as conversas são salvas em tempo real.
          2. Se o cliente disser que quer "falar com o Júnior" ou algo similar, responda: "O Júnior não está online no momento, mas pode deixar sua mensagem aqui que irei encaminhá-la diretamente para ele. Ele responderá assim que possível!"
          3. Se o cliente estiver fazendo um pedido de app, ajude-o com as perguntas necessárias.
          4. Mencione que o cliente pode ver "Projetos Anteriores" no menu (+) para conhecer o trabalho do Júnior.
          5. Ao finalizar um pedido, diga obrigatoriamente: "Obrigado pela requisição, o seu aplicativo será realizado dentro de 24h".
          6. Mantenha um tom profissional e prestativo.`,
        }
      });

      const aiText = response.text || "Erro ao processar.";
      const finalMessages: Message[] = [...newMessages, { role: "model", text: aiText, timestamp: new Date().toISOString() }];
      setMessages(finalMessages);
      await saveHistory(finalMessages);

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full w-full overflow-hidden",
      !isAdmin && "fixed inset-0 z-50 p-4 bg-black/50 backdrop-blur-sm items-center justify-center"
    )}>
      <div className={cn(
        "bg-[#efeae2] dark:bg-zinc-950 flex flex-col overflow-hidden shadow-2xl relative",
        isAdmin ? "h-full w-full" : "w-full max-w-2xl h-[85vh] rounded-2xl border border-zinc-200 dark:border-zinc-800"
      )}>
        {/* WhatsApp Header */}
        <div className="bg-[#075e54] dark:bg-zinc-900 p-3 flex items-center justify-between text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {isAdmin ? <User size={24} /> : <Bot size={24} />}
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">
                {isAdmin ? "Conversando com Cliente" : "Júnior Luis - Suporte"}
              </h2>
              <p className="text-[10px] opacity-80">Online</p>
            </div>
          </div>
          {!isAdmin && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* WhatsApp Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90"
        >
          <AnimatePresence>
            {showPastProjects && (
              <PastProjects onClose={() => setShowPastProjects(false)} />
            )}
          </AnimatePresence>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex w-full mb-1",
                (msg.role === "user" && !isAdmin) || (msg.role === "admin" && isAdmin) ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] p-2 rounded-lg shadow-sm relative text-sm",
                  ((msg.role === "user" && !isAdmin) || (msg.role === "admin" && isAdmin))
                    ? "bg-[#dcf8c6] dark:bg-emerald-900 text-zinc-900 dark:text-zinc-100 rounded-tr-none"
                    : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none"
                )}
              >
                <div className="markdown-body prose prose-xs dark:prose-invert">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[9px] opacity-50">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {((msg.role === "user" && !isAdmin) || (msg.role === "admin" && isAdmin)) && (
                    <CheckCheck size={12} className="text-blue-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg rounded-tl-none shadow-sm">
                <Loader2 size={14} className="animate-spin text-zinc-400" />
              </div>
            </div>
          )}
        </div>

        {/* Menu Overlay */}
        <AnimatePresence>
          {showMenu && !isAdmin && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-[64px] inset-x-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-20 shadow-2xl rounded-t-3xl"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">Menu Principal</h3>
                  <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenForm?.();
                    }}
                    className="flex flex-col items-center gap-3 p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/20 transition-all group"
                  >
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus size={24} />
                    </div>
                    <span className="text-sm font-bold text-center">Fazer Pedido do App</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowPastProjects(true);
                    }}
                    className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl border border-zinc-200 dark:border-zinc-700 transition-all group"
                  >
                    <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <History size={24} />
                    </div>
                    <span className="text-sm font-bold text-center">Ver Projetos Anteriores</span>
                  </button>

                  <button
                    onClick={() => handleSend("Gostaria de ver seu portfólio")}
                    className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl border border-zinc-200 dark:border-zinc-700 transition-all group"
                  >
                    <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LayoutGrid size={24} />
                    </div>
                    <span className="text-sm font-bold text-center">Ver Portfólio</span>
                  </button>

                  <button
                    onClick={() => handleSend("Como funcionam os prazos?")}
                    className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl border border-zinc-200 dark:border-zinc-700 transition-all group"
                  >
                    <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ClipboardList size={24} />
                    </div>
                    <span className="text-sm font-bold text-center">Prazos e Valores</span>
                  </button>

                  <button
                    onClick={() => handleSend("Quero falar com o Júnior")}
                    className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl border border-zinc-200 dark:border-zinc-700 transition-all group"
                  >
                    <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle size={24} />
                    </div>
                    <span className="text-sm font-bold text-center">Falar com Júnior</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp Input Area */}
        <div className="bg-[#f0f0f0] dark:bg-zinc-900 p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          {!isAdmin && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                "p-2 rounded-full transition-all",
                showMenu ? "bg-primary text-white rotate-45" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}
            >
              <Plus size={24} />
            </button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex-1 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mensagem"
              className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-full px-4 py-2 text-sm focus:ring-0 outline-none shadow-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-[#128c7e] text-white p-2.5 rounded-full disabled:opacity-50 hover:bg-[#075e54] transition-all shadow-md"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
