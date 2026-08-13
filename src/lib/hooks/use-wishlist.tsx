"use client";

import * as React from "react";

export interface WishlistContextType {
  isWishlisted: (id: string) => boolean;
  itemIds: string[];
  toggleWishlist: (id: string) => void;
}

const WishlistContext = React.createContext<undefined | WishlistContextType>(
  undefined,
);

const STORAGE_KEY = "wishlist";
const DEBOUNCE_MS = 500;

const loadWishlistFromStorage = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string");
    }
  } catch (err) {
    console.error("Failed to load wishlist:", err);
  }
  return [];
};

export function useWishlist(): WishlistContextType {
  const ctx = React.use(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}

export function WishlistProvider({ children }: React.PropsWithChildren) {
  const [itemIds, setItemIds] = React.useState<string[]>(
    loadWishlistFromStorage,
  );

  const saveTimeout = React.useRef<null | ReturnType<typeof setTimeout>>(null);

  React.useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itemIds));
      } catch (err) {
        console.error("Failed to save wishlist:", err);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [itemIds]);

  const toggleWishlist = React.useCallback((id: string) => {
    setItemIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  }, []);

  const isWishlisted = React.useCallback(
    (id: string) => itemIds.includes(id),
    [itemIds],
  );

  const value = React.useMemo<WishlistContextType>(
    () => ({ isWishlisted, itemIds, toggleWishlist }),
    [isWishlisted, itemIds, toggleWishlist],
  );

  return <WishlistContext value={value}>{children}</WishlistContext>;
}
