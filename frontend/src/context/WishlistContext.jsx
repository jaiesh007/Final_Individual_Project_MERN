import { createContext, useContext, useMemo, useState } from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "artisan-bazaar-wishlist";

const readWishlist = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(readWishlist);

  const persist = (nextItems) => {
    setItems(nextItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch {
      // Wishlist remains usable for the current session if storage is unavailable.
    }
  };

  const toggleWishlist = (product) => {
    persist(items.some((item) => item._id === product._id)
      ? items.filter((item) => item._id !== product._id)
      : [...items, product]);
  };

  const isWishlisted = (id) => items.some((item) => item._id === id);
  const removeFromWishlist = (id) => persist(items.filter((item) => item._id !== id));

  const value = useMemo(() => ({
    items,
    count: items.length,
    toggleWishlist,
    isWishlisted,
    removeFromWishlist
  }), [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
};
