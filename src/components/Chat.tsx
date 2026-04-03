import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { Send, User, Bot, Loader2, X, Check, CheckCheck, Menu, Plus, LayoutGrid, ClipboardList, MessageCircle, History, ArrowLeft, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { ProjectFormData } from "./ProjectForm";
import { PastProjects } from "./PastProjects";

interface Message {
  id: string;
  role: "user" | "model" | "admin";
  text: string;
  timestamp: string;
  deleted_for?: string[]; // Array of user emails or 'everyone'
}

interface Conversation {
  id: number;
  client_name: string;
  last_message: string;
  timestamp: string;
  unread?: boolean;
}

interface ChatProps {
  onClose: () => void;
  initialData?: ProjectFormData;
  requestId?: number;
  isAdmin?: boolean;
  userEmail?: string;
  onOpenForm?: () => void;
}

export function Chat({ onClose, initialData, requestId, isAdmin = false, userEmail, onOpenForm }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | undefined>(requestId);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showPastProjects, setShowPastProjects] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations for admin or find client chat
  useEffect(() => {
    if (isAdmin && !activeChatId) {
      const fetchConversations = async () => {
        const { data, error } = await supabase
          .from('requests')
          .select('id, client_name, chat_history, created_at')
          .order('created_at', { ascending: false });
        
        if (data) {
          const list: Conversation[] = data.map(req => {
            const history = req.chat_history ? JSON.parse(req.chat_history) : [];
            const lastMsg = history.length > 0 ? history[history.length - 1].text : "Iniciou uma conversa";
            const lastTime = history.length > 0 ? history[history.length - 1].timestamp : req.created_at;
            
            return {
              id: req.id,
              client_name: req.client_name,
              last_message: lastMsg,
              timestamp: lastTime
            };
          });
          setConversations(list);
        }
      };
      fetchConversations();

      const channel = supabase
        .channel('admin_conversations')
        .on('postgres_changes' as any, { event: '*', table: 'requests' }, () => {
          fetchConversations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else if (!isAdmin && !requestId && !activeChatId && userEmail) {
      // Find latest chat for this client
      const fetchClientChat = async () => {
        const { data, error } = await supabase
          .from('requests')
          .select('id, chat_history')
          .eq('client_name', userEmail.split('@')[0])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setActiveChatId(data.id);
          if (data.chat_history) {
            setMessages(JSON.parse(data.chat_history));
          }
        }
      };
      fetchClientChat();
    }
  }, [isAdmin, activeChatId, requestId, userEmail]);

  // Load messages for specific chat
  useEffect(() => {
    const id = activeChatId || requestId;
    if (id) {
      const fetchChat = async () => {
        const { data, error } = await supabase
          .from('requests')
          .select('chat_history')
          .eq('id', id)
          .single();
        
        if (data?.chat_history) {
          setMessages(JSON.parse(data.chat_history));
        }
      };
      fetchChat();

      const channel = supabase
        .channel(`chat_${id}`)
        .on('postgres_changes' as any, { 
          event: 'UPDATE', 
          table: 'requests', 
          filter: `id=eq.${id}` 
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
  }, [activeChatId, requestId]);

  // Initial greeting for new clients
  useEffect(() => {
    if (!requestId && !isAdmin) {
      const greeting = "Olá! Bem-vindo ao suporte da Luana-Ju. Como posso ajudar você hoje?";
      
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
      client_name: userEmail?.split('@')[0] || initialData?.appName || "Visitante",
      app_type: initialData?.appType || "Consulta Geral",
      chat_history: JSON.stringify(newHistory),
      service_photo: initialData?.servicePhoto,
      service_price: initialData?.servicePrice,
      logo_file: initialData?.logoFile,
      logo_preference: initialData?.logoPreference
    };

    const id = activeChatId || requestId;
    if (id) {
      await supabase.from('requests').update({ chat_history: JSON.stringify(newHistory) }).eq('id', id);
    } else {
      const { data, error } = await supabase.from('requests').insert([payload]).select().single();
      if (data) setActiveChatId(data.id);
    }
  };

  const deleteMessage = async (messageId: string, forEveryone: boolean) => {
    const newMessages = messages.map(msg => {
      if (msg.id === messageId) {
        const deletedFor = msg.deleted_for || [];
        if (forEveryone) {
          return { ...msg, deleted_for: [...deletedFor, 'everyone'] };
        } else {
          return { ...msg, deleted_for: [...deletedFor, userEmail || 'me'] };
        }
      }
      return msg;
    });
    setMessages(newMessages);
    await saveHistory(newMessages);
    setSelectedMessageId(null);
  };

  const clearHistory = async () => {
    if (!isAdmin || !activeChatId) return;
    if (confirm("Tem certeza que deseja eliminar toda a conversa? Esta ação é irreversível.")) {
      await supabase.from('requests').delete().eq('id', activeChatId);
      setActiveChatId(undefined);
      setMessages([]);
    }
  };

  const isWithin5Minutes = (timestamp: string) => {
    const msgTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    return (now - msgTime) < 5 * 60 * 1000;
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    const timestamp = new Date().toISOString();
    const newMessage: Message = { 
      id: Math.random().toString(36).substr(2, 9),
      role: isAdmin ? "admin" : "user", 
      text: userMessage, 
      timestamp 
    };
    const newMessages: Message[] = [...messages, newMessage];
    
    setInput("");
    setMessages(newMessages);
    setShowMenu(false);
    
    if (isAdmin) {
      await saveHistory(newMessages);
      const id = activeChatId || requestId;
      await supabase.from('notifications').insert([{
        title: "Mensagem da Luana-Ju",
        message: userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : ""),
        type: "message",
        target_id: id?.toString()
      }]);
      return;
    }

    // Trigger Notification for Admin
    const id = activeChatId || requestId;
    await supabase.from('notifications').insert([{
      title: "Nova Mensagem no Chat",
      message: userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : ""),
      type: "message",
      target_id: id?.toString()
    }]);

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
          systemInstruction: `Você é um assistente de vendas para Luana-Ju. 
          
          REGRAS IMPORTANTES:
          1. O aplicativo está conectado à nuvem (Supabase) e todas as conversas são salvas em tempo real.
          2. Se o cliente disser que quer "falar com a Luana-Ju" ou algo similar, responda: "A Luana-Ju não está online no momento, mas pode deixar sua mensagem aqui que irei encaminhá-la diretamente para ela. Ela responderá assim que possível!"
          3. Se o cliente estiver fazendo um pedido de app, ajude-o com as perguntas necessárias.
          4. Mencione que o cliente pode ver "Projetos Anteriores" no menu (+) para conhecer o trabalho da Luana-Ju.
          5. Ao finalizar um pedido, diga obrigatoriamente: "Obrigado pela requisição, o seu aplicativo será realizado dentro de 24h".
          6. Mantenha um tom profissional e prestativo.`,
        }
      });

      const aiText = response.text || "Erro ao processar.";
      const finalMessages: Message[] = [...newMessages, { 
        id: Math.random().toString(36).substr(2, 9),
        role: "model", 
        text: aiText, 
        timestamp: new Date().toISOString() 
      }];
      setMessages(finalMessages);
      await saveHistory(finalMessages);

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdmin && !activeChatId) {
    const filteredConversations = conversations.filter(c => 
      c.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full w-full bg-black overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 bg-zinc-900/50 border-b border-zinc-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Procurar membros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-primary outline-none text-zinc-300"
            />
            <Menu className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Members Horizontal List */}
          <div className="p-4">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {conversations.slice(0, 8).map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => setActiveChatId(c.id)}
                  className="flex flex-col items-center gap-2 min-w-[70px] group"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 group-hover:border-primary transition-all flex items-center justify-center text-zinc-400 font-bold text-xl overflow-hidden relative">
                    <img src={`https://picsum.photos/seed/${c.client_name}/200`} alt={c.client_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate w-16 text-center group-hover:text-primary transition-colors">@{c.client_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="px-4 space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Conversas Recentes</h3>
            <div className="space-y-3">
              {filteredConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChatId(c.id)}
                  className="w-full flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-[1.5rem] hover:bg-zinc-800/50 transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-2xl overflow-hidden">
                    <img src={`https://picsum.photos/seed/${c.client_name}/200`} alt={c.client_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 text-left space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-zinc-200 group-hover:text-primary transition-colors">@{c.client_name}</h4>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                      <span className="text-zinc-400">Você:</span> {c.last_message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full w-full overflow-hidden",
      !isAdmin && "fixed inset-0 z-50 p-4 bg-black/90 backdrop-blur-xl items-center justify-center"
    )}>
      <div className={cn(
        "bg-black flex flex-col overflow-hidden shadow-2xl relative border border-primary/20",
        isAdmin ? "h-full w-full" : "w-full max-w-2xl h-[85vh] rounded-3xl"
      )}>
        {/* WhatsApp Header */}
        <div className="bg-zinc-900 p-4 flex items-center justify-between text-white border-b border-primary/20 z-10">
          <div className="flex items-center gap-4">
            {(isAdmin || !isAdmin) && (
              <button 
                onClick={isAdmin ? () => setActiveChatId(undefined) : onClose} 
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-primary"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center overflow-hidden relative">
              {isAdmin ? <div className="text-xl font-bold">{conversations.find(c => c.id === activeChatId)?.client_name.charAt(0).toUpperCase()}</div> : <img src="input_file_0.png" alt="Luana-Ju" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full" />
            </div>
            <div>
              <h2 className="font-bold text-base gold-gradient leading-tight" style={{ fontFamily: 'serif' }}>
                {isAdmin ? `@${conversations.find(c => c.id === activeChatId)?.client_name}` : "Luana-Ju"}
              </h2>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online Agora</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && activeChatId && (
              <button 
                onClick={clearHistory}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                title="Eliminar toda a conversa"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button className="p-2 text-zinc-500 hover:text-primary transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* WhatsApp Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-black relative"
        >
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat invert" />
          
          <div className="flex justify-center mb-8">
            <span className="bg-zinc-900/50 text-zinc-500 text-[10px] px-4 py-1 rounded-full border border-zinc-800 uppercase tracking-widest">
              Criptografia de Ponta a Ponta
            </span>
          </div>

          {messages.filter(msg => {
            if (msg.deleted_for?.includes('everyone')) return false;
            if (msg.deleted_for?.includes(userEmail || 'me')) return false;
            return true;
          }).map((msg, i) => (
            <div
              key={msg.id || i}
              className={cn(
                "flex w-full mb-2 group/msg",
                (msg.role === "user" && !isAdmin) || (msg.role === "admin" && isAdmin) ? "justify-end" : "justify-start"
              )}
            >
              <div className="relative flex items-center gap-2">
                {((msg.role === "user" && !isAdmin) || (msg.role === "admin" && isAdmin)) && (
                  <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setSelectedMessageId(msg.id)}
                      className="p-1 text-zinc-600 hover:text-primary"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] p-4 rounded-2xl shadow-lg relative text-sm",
                    ((msg.role === "user" && !isAdmin) || (msg.role === "admin" && isAdmin))
                      ? "bg-primary text-black font-medium rounded-tr-none"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none"
                  )}
                >
                  <div className="markdown-body prose prose-xs prose-invert">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-2 opacity-60">
                    <span className="text-[9px]">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {((msg.role === "user" && !isAdmin) || (msg.role === "admin" && isAdmin)) && (
                      <CheckCheck size={12} className="text-black" />
                    )}
                  </div>

                  {selectedMessageId === msg.id && (
                    <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[150px]">
                      <button 
                        onClick={() => deleteMessage(msg.id, false)}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Eliminar para mim
                      </button>
                      {isWithin5Minutes(msg.timestamp) && (
                        <button 
                          onClick={() => deleteMessage(msg.id, true)}
                          className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 text-red-500 flex items-center gap-2"
                        >
                          <Trash2 size={12} /> Eliminar para todos
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedMessageId(null)}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 border-t border-zinc-800"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-[10px] text-zinc-500 italic">Digitando...</span>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Input Area */}
        <div className="bg-zinc-900 p-4 border-t border-primary/20 flex items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex-1 flex gap-3 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mensagem exclusiva..."
              className="flex-1 bg-black border border-zinc-800 rounded-full px-6 py-3 text-sm focus:border-primary outline-none shadow-inner text-zinc-300"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-primary text-black p-3 rounded-full disabled:opacity-50 hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
