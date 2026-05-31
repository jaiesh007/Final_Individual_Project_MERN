const API_ROOT = (import.meta.env.VITE_API_URL || "https://final-individual-project-mern.onrender.com/api").replace("/api", "");

export const imageUrl = (src) => {
  if (!src) return "https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?auto=format&fit=crop&w=900&q=80";
  if (src.startsWith("http")) return src;
  return `${API_ROOT}${src}`;
};
