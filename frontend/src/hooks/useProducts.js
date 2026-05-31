import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { products as fallbackProducts } from "../data/products.js";

export const useProducts = (params = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      setLoading(true);
      setError("");
      setUsingFallback(false);

      try {
        const { data } = await api.get("/products", { params });
        if (!ignore) setProducts(data);
      } catch {
        if (!ignore) {
          setError("Backend API is not running, showing demo products.");
          setUsingFallback(true);
          setProducts(
            fallbackProducts.filter((product) => {
              const matchesFeatured = params.featured ? product.featured : true;
              const matchesCategory = !params.category || params.category === "All" || product.category === params.category;
              const text = `${product.name} ${product.description} ${product.material}`.toLowerCase();
              const matchesSearch = !params.search || text.includes(params.search.toLowerCase());
              return matchesFeatured && matchesCategory && matchesSearch;
            })
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      ignore = true;
    };
  }, [JSON.stringify(params)]);

  return { products, setProducts, loading, error, usingFallback };
};
