import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { User, Camera, Loader2, ArrowLeft, Save, Phone, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ProfileProps {
  onBack: () => void;
  userId: string;
}

export function UserProfile({ onBack, userId }: ProfileProps) {
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    email: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          email: data.email || ""
        });
      } else {
        // Get email from auth if profile doesn't exist
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setProfile(prev => ({ ...prev, email: user.email || "" }));
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          email: profile.email,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      alert("Erro ao carregar foto.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-primary">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold gold-gradient" style={{ fontFamily: 'serif' }}>Meu Perfil</h2>
      </header>

      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 bg-zinc-900 flex items-center justify-center relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={64} className="text-zinc-700" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-primary text-black p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Camera size={20} />
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome Completo</label>
              <input 
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-primary outline-none text-zinc-300"
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">E-mail</label>
              <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500">
                <Mail size={18} />
                <span>{profile.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Telefone / Contacto</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 focus:border-primary outline-none text-zinc-300"
                  placeholder="+244 ..."
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full gold-bg text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            SALVAR ALTERAÇÕES
          </button>
        </div>
      </div>
    </div>
  );
}
