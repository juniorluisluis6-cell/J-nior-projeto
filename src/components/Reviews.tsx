import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, MessageSquare, Plus, X, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsProps {
  onBack: () => void;
  userEmail?: string;
}

export function Reviews({ onBack, userEmail }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('reviews').insert([
        {
          user_name: userEmail?.split('@')[0] || "Cliente Premium",
          rating,
          comment,
        }
      ]);

      if (error) throw error;
      
      // Trigger Notification
      await supabase.from('notifications').insert([{
        title: "Nova Avaliação Recebida",
        message: `${userEmail?.split('@')[0]} deu ${rating} estrelas: "${comment.substring(0, 50)}..."`,
        type: "review"
      }]);

      setComment("");
      setRating(5);
      setIsAdding(false);
      fetchReviews();
    } catch (err) {
      console.error("Error adding review:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-primary">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold gold-gradient" style={{ fontFamily: 'serif' }}>Avaliações</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="gold-bg text-black px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <Plus size={18} /> Avaliar Agora
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="luxury-card p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                  {review.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{review.user_name}</h4>
                  <p className="text-[10px] text-zinc-500">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    className={i < review.rating ? "fill-primary text-primary" : "text-zinc-700"} 
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-400 italic leading-relaxed">
              "{review.comment}"
            </p>
          </motion.div>
        ))}
        {reviews.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            Nenhuma avaliação ainda. Seja o primeiro a avaliar!
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md luxury-card p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold gold-gradient">Nova Avaliação</h3>
                <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest">Sua Nota</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className={`p-2 rounded-xl transition-all ${rating >= num ? "bg-primary/20 text-primary" : "bg-zinc-900 text-zinc-700"}`}
                      >
                        <Star size={24} className={rating >= num ? "fill-primary" : ""} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest">Seu Comentário</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:border-primary outline-none h-32 resize-none"
                    placeholder="Conte-nos sua experiência..."
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full gold-bg text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Publicar Avaliação"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
