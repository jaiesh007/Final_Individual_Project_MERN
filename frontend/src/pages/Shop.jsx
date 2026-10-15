import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useProducts } from "../hooks/useProducts.js";

const Shop = () => {
  const [category, setCategory] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useMemo(() => ({
    category: category === "All" ? undefined : category,
    search: search || undefined,
    sortBy,
    page,
    limit: pageSize
  }), [category, search, sortBy, page, pageSize]);

  const { products, loading, error, pagination } = useProducts(query);
  const total = pagination?.total ?? products.length;
  const totalPages = pagination?.totalPages ?? 1;
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => Math.max(1, Math.min(page - 2, totalPages - 4)) + index);

  return (
    <section className="page-section">
      <div className="shop-header"><div><span className="eyebrow">The handmade marketplace</span><h1>Shop handmade crafts</h1><p>Find pieces with a story, made by independent artisans.</p></div><label className="search-box"><Search size={18} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search products, materials…" aria-label="Search products" /></label></div>
      <CategoryFilter active={category} onChange={(value) => { setCategory(value); setPage(1); }} />
      <div className="shop-tools"><p className="results-count">{total.toLocaleString("en-IN")} {total === 1 ? "piece" : "pieces"} to discover</p><label><span className="sr-only">Sort products</span><select className="shop-sort" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}><option value="featured">Sort: Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name: A to Z</option></select></label><label className="page-size-select"><span>Per page</span><select className="shop-sort" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="Products per page"><option value={12}>12</option><option value={24}>24</option><option value={48}>48</option></select></label></div>
      {loading && <p className="notice" aria-live="polite">Loading page {page}…</p>}
      {error && <p className="notice">{error}</p>}
      <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product._id || product.name} />)}{!loading && products.length === 0 && <div className="empty-products"><h3>No crafts found</h3><p>Try another search term or choose a different category.</p></div>}</div>
      {total > pageSize && <nav className="pagination" aria-label="Product pages"><button type="button" onClick={() => { setPage((current) => Math.max(1, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page <= 1}><ChevronLeft size={17} /> Previous</button><div className="pagination-numbers">{pageNumbers.map((number) => <button type="button" key={number} className={number === page ? "current" : ""} aria-current={number === page ? "page" : undefined} onClick={() => { setPage(number); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{number}</button>)}</div><span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span><button type="button" onClick={() => { setPage((current) => Math.min(totalPages, current + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page >= totalPages}>Next <ChevronRight size={17} /></button></nav>}
    </section>
  );
};

export default Shop;
