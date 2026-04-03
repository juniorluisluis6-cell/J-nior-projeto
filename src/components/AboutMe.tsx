import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Code, Rocket, Award, Heart, ArrowLeft, Camera, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AboutMeProps {
  onBack: () => void;
  isAdmin?: boolean;
}

export function AboutMe({ onBack, isAdmin = false }: AboutMeProps) {
  const [photoUrl, setPhotoUrl] = useState<string>("https://picsum.photos/seed/luanaju/800/1000");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', 'admin')
      .single();
    
    if (data?.avatar_url) {
      setPhotoUrl(data.avatar_url);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `admin-avatar-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: 'admin', avatar_url: publicUrl });

      if (updateError) throw updateError;

      setPhotoUrl(publicUrl);
      alert("Foto atualizada com sucesso!");
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      alert("Erro ao carregar foto. Certifique-se de que o bucket 'avatars' existe no Supabase.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-primary">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold gold-gradient" style={{ fontFamily: 'serif' }}>Sobre Luana-Ju</h2>
      </header>

      <section className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
          <div className="relative">
            <img 
              src={photoUrl} 
              alt="Luana-Ju" 
              className="rounded-3xl border border-primary/20 shadow-2xl w-full h-[500px] object-cover"
              referrerPolicy="no-referrer"
            />
            {isAdmin && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-4 right-4 bg-primary text-black p-4 rounded-2xl shadow-xl hover:scale-110 transition-all active:scale-95 flex items-center gap-2 font-bold"
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
                <span className="text-xs uppercase tracking-widest">Alterar Foto</span>
              </button>
            )}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              accept="image/*"
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-primary">Especialista em Soluções Digitais</h3>
            <p className="text-zinc-400 leading-relaxed">
              Com anos de experiência no mercado de tecnologia, Luana-Ju dedica-se a transformar visões complexas em aplicativos fluidos, modernos e altamente lucrativos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Code, label: "Desenvolvimento", desc: "Código limpo e escalável" },
              { icon: Rocket, label: "Inovação", desc: "Tecnologias de ponta" },
              { icon: Award, label: "Qualidade", desc: "Padrão premium de entrega" },
              { icon: Heart, label: "Paixão", desc: "Foco no sucesso do cliente" },
            ].map((item, i) => (
              <div key={i} className="p-4 luxury-card space-y-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <item.icon size={20} />
                </div>
                <h4 className="font-bold text-sm">{item.label}</h4>
                <p className="text-[10px] text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <p className="text-zinc-500 text-sm italic border-l-2 border-primary pl-4">
              "Meu objetivo não é apenas entregar um código, mas sim uma ferramenta que impulsione o seu negócio ao próximo nível de exclusividade."
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
