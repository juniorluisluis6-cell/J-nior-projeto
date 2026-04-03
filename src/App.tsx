import React, { useState, useEffect } from "react";
import { Auth } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import { Chat } from "./components/Chat";
import { AI } from "./components/AI";
import { AboutMe } from "./components/AboutMe";
import { Reviews } from "./components/Reviews";
import { Notifications } from "./components/Notifications";
import { Portfolio } from "./components/Portfolio";
import { UserProfile } from "./components/Profile";
import { supabase } from "./lib/supabase";
import { LogOut, User as UserIcon, Bell, LayoutGrid, Star, Plus, MessageSquare, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { ProjectForm } from "./components/ProjectForm";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState("portfolio");
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (session) {
      fetchUnreadCount();
      
      const channel = supabase
        .channel('notifications_changes')
        .on('postgres_changes', { event: '*', table: 'notifications' }, () => {
          fetchUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchUnreadCount = async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    
    if (!error && count !== null) {
      setUnreadCount(count);
    }
  };

  const handleNotificationClick = (targetId?: string) => {
    if (targetId) {
      setSelectedChatId(parseInt(targetId));
      setCurrentSection("chat");
    } else {
      setCurrentSection("notifications");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdmin(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdmin(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = (session: any) => {
    if (session?.user?.email === "juniorluisluis6@gmail.com") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentSection("portfolio");
  };

  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleProjectComplete = async (data: any) => {
    try {
      const { data: requestData, error } = await supabase.from('requests').insert([
        {
          client_name: session?.user?.email?.split('@')[0] || "Cliente Premium",
          app_type: data.appType,
          app_name: data.appName,
          logo_preference: data.logoPreference,
          logo_file: data.logoFile,
          service_photo: data.servicePhoto,
          service_price: data.servicePrice,
        }
      ]).select().single();

      if (error) throw error;
      
      // Trigger Notification
      await supabase.from('notifications').insert([{
        title: "Novo Pedido de Projeto",
        message: `O cliente ${session?.user?.email?.split('@')[0]} solicitou um app do tipo ${data.appType}.`,
        type: "project",
        target_id: requestData?.id?.toString()
      }]);

      setIsFormOpen(false);
      setCurrentSection("chat");
    } catch (err) {
      console.error("Error saving project request:", err);
    }
  };

  if (!session) {
    return <Auth onSession={setSession} />;
  }

  const navItems = [
    { id: "portfolio", icon: LayoutGrid, label: "PORTFÓLIO" },
    { id: "notifications", icon: Bell, label: "NOTIF.", badge: unreadCount },
    { id: "reviews", icon: Star, label: "AVALIAÇÃO" },
    { id: "center", icon: Plus, label: "" }, // Center button
    { id: "profile", icon: UserIcon, label: "PERFIL" },
    { id: "ai", icon: Bot, label: "IA" },
    { id: "chat", icon: MessageSquare, label: "CHAT" },
  ];

  return (
    <div className="min-h-screen bg-black text-foreground font-sans flex flex-col">
      {/* Premium Top Bar */}
      <nav className="border-b border-primary/10 sticky top-0 bg-black/80 backdrop-blur-xl z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCurrentSection("portfolio")}
          >
            <img 
              src="input_file_0.png" 
              alt="Luana-Ju Logo" 
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                {isAdmin ? "Administrador" : "Premium"}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-red-500 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-32 pt-6">
        <AnimatePresence mode="wait">
          {currentSection === "portfolio" && (
            <motion.div key="portfolio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Portfolio onBack={() => {}} isAdmin={isAdmin} />
            </motion.div>
          )}

          {currentSection === "notifications" && (
            <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Notifications 
                onBack={() => setCurrentSection("portfolio")} 
                userEmail={session.user.email} 
                onNotificationClick={handleNotificationClick}
              />
            </motion.div>
          )}

          {currentSection === "reviews" && (
            <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Reviews onBack={() => setCurrentSection("portfolio")} userEmail={session.user.email} />
            </motion.div>
          )}

          {currentSection === "about" && (
            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AboutMe onBack={() => setCurrentSection("portfolio")} isAdmin={isAdmin} />
            </motion.div>
          )}

          {currentSection === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UserProfile onBack={() => setCurrentSection("portfolio")} userId={session.user.id} />
            </motion.div>
          )}

          {currentSection === "ai" && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AI onBack={() => setCurrentSection("portfolio")} />
            </motion.div>
          )}

          {currentSection === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-180px)]">
              <Chat 
                onClose={() => {
                  setCurrentSection("portfolio");
                  setSelectedChatId(undefined);
                }} 
                isAdmin={isAdmin} 
                userEmail={session.user.email} 
                requestId={selectedChatId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Luxury Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-black/90 backdrop-blur-xl border-t border-zinc-900 pb-safe">
        <div className="max-w-md mx-auto px-2 py-3 flex items-end justify-between relative">
          {navItems.map((item, idx) => {
            if (item.id === "center") {
              return (
                <div key={item.id} className="relative -top-6">
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="w-16 h-16 gold-bg rounded-[1.5rem] flex items-center justify-center text-black shadow-[0_0_20px_rgba(191,149,63,0.4)] hover:scale-110 transition-transform active:scale-95"
                  >
                    <Plus size={32} strokeWidth={2.5} />
                  </button>
                </div>
              );
            }

            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentSection(item.id)}
                className="flex flex-col items-center gap-1.5 flex-1 group"
              >
                <div className={cn(
                  "transition-all duration-300 relative",
                  isActive ? "text-primary scale-110" : "text-zinc-600 group-hover:text-zinc-400"
                )}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
                  )}
                </div>
                <span className={cn(
                  "text-[8px] font-bold tracking-tighter transition-all duration-300",
                  isActive ? "text-primary" : "text-zinc-700"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-3 w-12 h-0.5 gold-bg rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Overlay */}
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
