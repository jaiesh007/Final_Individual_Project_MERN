import { PackageCheck, Paintbrush, ShoppingCart, Users } from "lucide-react";

const stats = [
  { label: "Artisans", value: "120+", icon: Users },
  { label: "Products", value: "450+", icon: PackageCheck },
  { label: "Craft Types", value: "24", icon: Paintbrush },
  { label: "Orders", value: "1.8k", icon: ShoppingCart }
];

const StatsCards = () => {
  return (
    <section className="stats-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div className="stat-card" key={stat.label}>
            <Icon size={22} />
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        );
      })}
    </section>
  );
};

export default StatsCards;
