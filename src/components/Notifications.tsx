import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bell, MessageSquare, Rocket, Star, ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "message" | "project" | "review";
  is_read: boolean;
  target_id?: string;
  created_at: string;
}

interface NotificationsProps {
  onBack: () => void;
  userEmail?: string;
  onNotificationClick: (targetId?: string) => void;
}

export function Notifications({ onBack, userEmail, onNotificationClick }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setNotifications(data);
  };

  const deleteNotification = async (id: number) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) fetchNotifications();
  };

  const markAsRead = async (id: number, targetId?: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    onNotificationClick(targetId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-primary">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold gold-gradient" style={{ fontFamily: 'serif' }}>Notificações</h2>
      </header>

      <div className="space-y-4">
        {notifications.map((notif, index) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "luxury-card p-6 flex items-center gap-6 group cursor-pointer relative overflow-hidden",
              !notif.is_read && "border-primary/30 bg-primary/5"
            )}
            onClick={() => markAsRead(notif.id, notif.target_id)}
          >
            {!notif.is_read && (
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            )}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              notif.type === "message" ? "bg-blue-500/10 text-blue-500" :
              notif.type === "project" ? "bg-emerald-500/10 text-emerald-500" :
              "bg-yellow-500/10 text-yellow-500"
            }`}>
              {notif.type === "message" && <MessageSquare size={24} />}
              {notif.type === "project" && <Rocket size={24} />}
              {notif.type === "review" && <Star size={24} />}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-primary">{notif.title}</h4>
              <p className="text-xs text-zinc-400">{notif.message}</p>
              <p className="text-[10px] text-zinc-600">{new Date(notif.created_at).toLocaleString()}</p>
            </div>
            <button 
              onClick={() => deleteNotification(notif.id)}
              className="p-2 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-24 text-zinc-500 space-y-4">
            <Bell size={64} className="mx-auto opacity-10" />
            <p>Você não tem novas notificações no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
