import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppliedCoupon, CartCourseItem } from "../types";
import { calculateCartTotals, type CartTotals } from "../utils/pricing";

interface StoreState {
  cart: CartCourseItem[];
  wishlist: CartCourseItem[];
  coupon: AppliedCoupon | null;
  addToCart: (item: CartCourseItem) => boolean;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (item: CartCourseItem) => boolean;
  applyCouponState: (coupon: AppliedCoupon | null) => void;
  getCartTotals: () => CartTotals;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      coupon: null,

      addToCart: (item) => {
        const exists = get().cart.some((c) => c.id === item.id);
        if (exists) return false;
        set((state) => ({ cart: [...state.cart, item] }));
        return true;
      },

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ cart: [], coupon: null }),

      toggleWishlist: (item) => {
        const exists = get().wishlist.some((c) => c.id === item.id);
        if (exists) {
          set((state) => ({
            wishlist: state.wishlist.filter((c) => c.id !== item.id),
          }));
          return false;
        }
        set((state) => ({ wishlist: [...state.wishlist, item] }));
        return true;
      },

      applyCouponState: (coupon) => set({ coupon }),

      getCartTotals: () => {
        const { cart, coupon } = get();
        return calculateCartTotals(cart, coupon);
      },
    }),
    {
      name: "codeacademy-storage",
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        coupon: state.coupon,
      }),
    }
  )
);
