import React, { useState } from "react";
import { motion } from "motion/react";
import { X, ArrowRight, Upload, DollarSign, Tag, Type, Image as ImageIcon, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface ProjectFormProps {
  onClose: () => void;
  onComplete: (formData: ProjectFormData) => void;
}

export interface ProjectFormData {
  appType: string;
  appName: string;
  logoPreference: string;
  logoFile?: string;
  servicePhoto?: string;
  servicePrice: string;
}

export function ProjectForm({ onClose, onComplete }: ProjectFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>({
    appType: "",
    appName: "",
    logoPreference: "",
    servicePrice: "",
  });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onComplete(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'servicePhoto' | 'logoFile') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Tag size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Passo 1 de 5</span>
            </div>
            <h2 className="text-2xl font-bold gold-gradient mb-2">Que tipo de aplicativo você deseja?</h2>
            <p className="text-zinc-500 text-sm italic">Ex: E-commerce, Delivery, Portfólio, Gestão...</p>
            <input
              autoFocus
              type="text"
              value={formData.appType}
              onChange={(e) => setFormData({ ...formData, appType: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-lg focus:border-primary outline-none transition-all text-white"
              placeholder="Descreva o tipo..."
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Type size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Passo 2 de 5</span>
            </div>
            <h2 className="text-2xl font-bold gold-gradient mb-2">Qual o nome do aplicativo?</h2>
            <input
              autoFocus
              type="text"
              value={formData.appName}
              onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-lg focus:border-primary outline-none transition-all text-white"
              placeholder="Nome da sua marca ou app..."
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <ImageIcon size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Passo 3 de 5</span>
            </div>
            <h2 className="text-2xl font-bold gold-gradient mb-2">Qual logotipo você prefere?</h2>
            <p className="text-zinc-500 text-sm italic">Descreva sua preferência ou carregue seu logo abaixo.</p>
            <textarea
              autoFocus
              value={formData.logoPreference}
              onChange={(e) => setFormData({ ...formData, logoPreference: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-lg focus:border-primary outline-none min-h-[120px] transition-all text-white resize-none"
              placeholder="Descreva sua preferência de logo..."
            />
            
            <div className="relative group mt-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logoFile')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border-2 border-dashed rounded-2xl p-6 text-center transition-all flex items-center justify-center gap-4",
                formData.logoFile ? "border-primary bg-primary/5" : "border-zinc-800 hover:border-primary/50"
              )}>
                {formData.logoFile ? (
                  <>
                    <img src={formData.logoFile} alt="Logo Preview" className="h-12 w-12 rounded-xl object-cover border border-primary/30" />
                    <span className="text-sm font-bold text-primary">Logo exclusivo carregado!</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-zinc-600" />
                    <span className="text-sm text-zinc-500 font-medium">Já possui um logo? Toque para enviar</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Upload size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Passo 4 de 5</span>
            </div>
            <h2 className="text-2xl font-bold gold-gradient mb-2">Foto do seu serviço</h2>
            <p className="text-zinc-500 text-sm italic mb-4">Uma imagem vale mais que mil palavras no mundo digital.</p>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'servicePhoto')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border-2 border-dashed rounded-[2rem] p-12 text-center transition-all",
                formData.servicePhoto ? "border-primary bg-primary/5" : "border-zinc-800 hover:border-primary/50"
              )}>
                {formData.servicePhoto ? (
                  <div className="relative inline-block">
                    <img src={formData.servicePhoto} alt="Preview" className="max-h-48 mx-auto rounded-2xl shadow-2xl border border-primary/20" />
                    <div className="absolute -top-2 -right-2 bg-primary text-black p-1 rounded-full shadow-lg">
                      <Check size={16} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <ImageIcon className="text-primary" size={32} />
                    </div>
                    <p className="text-zinc-500 font-medium">Arraste ou toque para enviar a foto</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <DollarSign size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Passo 5 de 5</span>
            </div>
            <h2 className="text-2xl font-bold gold-gradient mb-2">Qual o preço do seu serviço?</h2>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">R$</span>
              <input
                autoFocus
                type="text"
                value={formData.servicePrice}
                onChange={(e) => setFormData({ ...formData, servicePrice: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-16 pr-6 py-4 text-xl focus:border-primary outline-none transition-all text-white font-bold"
                placeholder="0,00"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.appType.trim().length > 0;
      case 2: return formData.appName.trim().length > 0;
      case 3: return formData.logoPreference.trim().length > 0;
      case 4: return true; // Optional photo
      case 5: return formData.servicePrice.trim().length > 0;
      default: return false;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
    >
      <div className="bg-black w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-primary/20">
        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-zinc-900/50">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 w-10 rounded-full transition-all duration-500",
                  s <= step ? "gold-bg" : "bg-zinc-800"
                )}
              />
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 min-h-[300px] flex flex-col justify-center">
          {renderStep()}
        </div>

        <div className="p-8 bg-zinc-900/50 border-t border-primary/10 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex items-center gap-3 gold-bg text-black px-10 py-4 rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-primary/10"
          >
            {step === 5 ? "Finalizar Pedido" : "Próximo Passo"}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
