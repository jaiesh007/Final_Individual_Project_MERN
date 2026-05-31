import { categories } from "../data/products.js";

const CategoryFilter = ({ active, onChange }) => {
  return (
    <div className="category-filter" aria-label="Product categories">
      {categories.map((category) => (
        <button
          key={category}
          className={active === category ? "active" : ""}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
