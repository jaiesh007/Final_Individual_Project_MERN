import { useEffect, useState } from "react";
import { categories as defaults } from "../data/products.js";
import api from "../api/axios.js";

const CategoryFilter = ({ active, onChange }) => {
  const [categories, setCategories] = useState(defaults);
  useEffect(() => {
    let alive = true;
    api.get("/categories").then(({ data }) => { if (alive && Array.isArray(data)) setCategories(["All", ...data.filter((item) => item !== "All")]); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const options = categories.includes("All") ? categories : ["All", ...categories];
  return <div className="category-filter" aria-label="Product categories">{options.map((category) => <button type="button" key={category} className={active === category ? "active" : ""} aria-pressed={active === category} onClick={() => onChange(category)}>{category}</button>)}</div>;
};

export default CategoryFilter;
