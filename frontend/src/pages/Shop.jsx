import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useProducts } from "../hooks/useProducts.js";

const Shop = () => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
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

  const sortedProducts = useMemo(() => {
    const items = [...filtered];
    if (sortBy === "price-low") items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortBy === "price-high") items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sortBy === "name") items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return items;
  }, [filtered, sortBy]);

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
      <div className="shop-tools">
        <p className="results-count">{sortedProducts.length} {sortedProducts.length === 1 ? "piece" : "pieces"} to discover</p>
        <label>
          <span className="sr-only">Sort products</span>
          <select className="shop-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
      </div>
      {loading && <p className="notice">Loading products from database...</p>}
      {error && <p className="notice">{error}</p>}
      <div className="product-grid">
        {sortedProducts.map((product) => <ProductCard product={product} key={product._id} />)}
        {!loading && sortedProducts.length === 0 && <div className="empty-products"><h3>No crafts found</h3><p>Try another search term or choose a different category.</p></div>}
      </div>
    </section>
  );
};

export default Shop;
