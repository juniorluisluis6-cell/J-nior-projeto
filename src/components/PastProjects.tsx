import React from "react";
import { X, ExternalLink, Smartphone, Layout, Database } from "lucide-react";
import { motion } from "motion/react";

interface Project {
  id: number;
  title: string;
  type: "Mobile" | "Web" | "System";
  description: string;
  image: string;
  year: string;
}

const pastProjects: Project[] = [
  {
    id: 1,
    title: "Delivery Express",
    type: "Mobile",
    description: "Aplicativo completo de delivery com rastreamento em tempo real e pagamentos integrados.",
    image: "https://picsum.photos/seed/delivery/800/600",
    year: "2023"
  },
  {
    id: 2,
    title: "EcoStore E-commerce",
    type: "Web",
    description: "Plataforma de vendas online focada em produtos sustentáveis com gestão de estoque.",
    image: "https://picsum.photos/seed/ecommerce/800/600",
    year: "2023"
  },
  {
    id: 3,
    title: "Gestão Pro",
    type: "System",
    description: "Sistema ERP para pequenas empresas com controle financeiro e emissão de notas.",
    image: "https://picsum.photos/seed/system/800/600",
    year: "2024"
  },
  {
    id: 4,
    title: "FitLife App",
    type: "Mobile",
    description: "App de treinos personalizados com integração com smartwatches e planos de dieta.",
    image: "https://picsum.photos/seed/fitness/800/600",
    year: "2024"
  }
];

interface PastProjectsProps {
  onClose: () => void;
}

export function PastProjects({ onClose }: PastProjectsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-30 bg-white dark:bg-zinc-900 flex flex-col"
    >
      <div className="p-4 bg-primary text-white flex items-center justify-between shadow-md">
        <h3 className="font-bold">Projetos Realizados</h3>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {pastProjects.map((project) => (
          <div key={project.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-40 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 bg-primary/10 rounded-full flex items-center gap-1">
                  {project.type === "Mobile" && <Smartphone size={10} />}
                  {project.type === "Web" && <Layout size={10} />}
                  {project.type === "System" && <Database size={10} />}
                  {project.type}
                </span>
                <span className="text-[10px] font-medium text-zinc-400">{project.year}</span>
              </div>
              <h4 className="font-bold text-lg mb-1">{project.title}</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                {project.description}
              </p>
              <button className="w-full py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                Ver Detalhes <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
