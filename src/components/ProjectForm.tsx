import React, { useState } from "react";
import { motion } from "motion/react";
import { X, ArrowRight, Upload, DollarSign, Tag, Type, Image as ImageIcon } from "lucide-react";
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
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Que tipo de aplicativo você deseja?</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Ex: E-commerce, Delivery, Portfólio, Gestão...</p>
            <input
              autoFocus
              type="text"
              value={formData.appType}
              onChange={(e) => setFormData({ ...formData, appType: e.target.value })}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-primary outline-none"
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
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Qual o nome do aplicativo?</h2>
            <input
              autoFocus
              type="text"
              value={formData.appName}
              onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-primary outline-none"
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
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Qual logotipo você prefere?</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Descreva sua preferência ou carregue seu logo abaixo.</p>
            <textarea
              autoFocus
              value={formData.logoPreference}
              onChange={(e) => setFormData({ ...formData, logoPreference: e.target.value })}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
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
                "border-2 border-dashed rounded-xl p-4 text-center transition-colors flex items-center justify-center gap-3",
                formData.logoFile ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-800"
              )}>
                {formData.logoFile ? (
                  <>
                    <img src={formData.logoFile} alt="Logo Preview" className="h-10 w-10 rounded object-cover" />
                    <span className="text-sm font-medium text-primary">Logo carregado com sucesso!</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} className="text-zinc-400" />
                    <span className="text-sm text-zinc-500">Já tem um logo? Clique para carregar</span>
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
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Envie uma foto do seu serviço</h2>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'servicePhoto')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center group-hover:border-primary transition-colors">
                {formData.servicePhoto ? (
                  <img src={formData.servicePhoto} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-md" />
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="text-zinc-400" />
                    </div>
                    <p className="text-zinc-500">Clique ou arraste uma imagem aqui</p>
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
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Qual o preço do seu serviço?</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-lg">R$</span>
              <input
                autoFocus
                type="text"
                value={formData.servicePrice}
                onChange={(e) => setFormData({ ...formData, servicePrice: e.target.value })}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl pl-12 pr-4 py-3 text-lg focus:ring-2 focus:ring-primary outline-none"
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all",
                  s <= step ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                )}
              />
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {renderStep()}
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {step === 5 ? "Finalizar e Abrir Chat" : "Próximo"}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
