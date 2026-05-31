import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useProducts } from "../hooks/useProducts.js";

const Shop = () => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const query = useMemo(() => {
    return {
      category: category === "All" ? undefined : category,
      search: search || undefined
    };
  }, [category, search]);
  const { products, loading, error } = useProducts(query);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const text = `${product.name} ${product.description} ${product.material}`.toLowerCase();
      return matchesCategory && text.includes(search.toLowerCase());
    });
  }, [category, search, products]);

  return (
    <section className="page-section">
      <div className="shop-header">
        <div>
          <span className="eyebrow">Marketplace</span>
          <h1>Shop handmade crafts</h1>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
          />
        </label>
      </div>
      <CategoryFilter active={category} onChange={setCategory} />
      {loading && <p className="notice">Loading products from database...</p>}
      {error && <p className="notice">{error}</p>}
      <div className="product-grid">
        {filtered.map((product) => <ProductCard product={product} key={product._id} />)}
      </div>
    </section>
  );
};

export default Shop;
