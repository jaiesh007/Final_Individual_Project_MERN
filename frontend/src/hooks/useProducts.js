import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { products as fallbackProducts } from "../data/products.js";

export const useProducts = (params = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    let ignore = false;
    const loadProducts = async () => {
      setLoading(true);
      setError("");
      setUsingFallback(false);
      try {
        const { data } = await api.get("/products", { params });
        if (ignore) return;
        if (Array.isArray(data)) {
          setProducts(data);
          setPagination(null);
        } else {
          setProducts(data.items || []);
          setPagination({ page: data.page || 1, limit: data.limit || 12, total: data.total || 0, totalPages: data.totalPages || 1 });
        }
      } catch {
        if (ignore) return;
        setError("Backend API is not running, showing demo products.");
        setUsingFallback(true);
        let items = fallbackProducts.filter((product) => {
          const matchesFeatured = params.featured ? product.featured : true;
          const matchesCategory = !params.category || params.category === "All" || product.category === params.category;
          const text = `${product.name} ${product.description} ${product.material}`.toLowerCase();
          const matchesSearch = !params.search || text.includes(String(params.search).toLowerCase());
          const matchesArtisan = !params.artisan || String(product.artisan?._id || product.artisan) === String(params.artisan);
          return matchesFeatured && matchesCategory && matchesSearch && matchesArtisan;
        });
        if (params.sortBy === "price-low") items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        if (params.sortBy === "price-high") items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        if (params.sortBy === "name") items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        if (params.page !== undefined || params.limit !== undefined) {
          const page = Math.max(1, Number(params.page) || 1);
          const limit = Math.min(48, Math.max(1, Number(params.limit) || 12));
          setPagination({ page, limit, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)) });
          items = items.slice((page - 1) * limit, page * limit);
        } else setPagination(null);
        setProducts(items);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadProducts();
    return () => { ignore = true; };
  }, [JSON.stringify(params)]);

  return { products, setProducts, loading, error, usingFallback, pagination };
};
