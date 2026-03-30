import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct, IProductVariant } from "@/types";

export interface CartItem {
  product: IProduct;
  variant: IProductVariant;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (
    product: IProduct,
    variant: IProductVariant,
    quantity?: number,
  ) => void;
  removeItem: (productId: string, variantSku: string) => void;
  updateQuantity: (
    productId: string,
    variantSku: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, variant, quantity = 1) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) =>
            item.product._id === product._id &&
            item.variant.sku === variant.sku,
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, { product, variant, quantity }] });
        }
      },

      removeItem: (productId, variantSku) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.product._id === productId &&
                item.variant.sku === variantSku
              ),
          ),
        });
      },

      updateQuantity: (productId, variantSku, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, variantSku);
          return;
        }

        const items = get().items.map((item) => {
          if (
            item.product._id === productId &&
            item.variant.sku === variantSku
          ) {
            return { ...item, quantity };
          }
          return item;
        });

        set({ items });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price =
            item.variant.price ||
            item.product.salePrice ||
            item.product.basePrice;
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
