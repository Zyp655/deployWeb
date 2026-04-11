import { create } from 'zustand';
import { Product, SelectedOption } from '@/lib/api/client';

export interface CartItem {
  cartItemId: string; // Unique ID for product + options combination
  product: Product;
  quantity: number;
  note: string;
  selectedOptions?: SelectedOption[];
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, selectedOptions?: SelectedOption[]) => void;
  clearAndAddItem: (product: Product, selectedOptions?: SelectedOption[]) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateNote: (cartItemId: string, note: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const generateCartItemId = (productId: string, options?: SelectedOption[]) => {
  if (!options || options.length === 0) return productId;
  const sortedOptions = [...options].sort(
    (a, b) => a.group.localeCompare(b.group) || a.choice.localeCompare(b.choice)
  );
  return `${productId}-${JSON.stringify(sortedOptions)}`;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  addItem: (product: Product, selectedOptions?: SelectedOption[]) => {
    set((state) => {
      // Logic for single-store cart rule
      if (state.items.length > 0) {
        const currentStoreId = state.items[0].product.storeId;
        if (currentStoreId && product.storeId && currentStoreId !== product.storeId) {
          throw new Error('DIFFERENT_STORE');
        }
      }

      const cartItemId = generateCartItemId(product.id, selectedOptions);
      const existing = state.items.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { items: [...state.items, { cartItemId, product, quantity: 1, note: '', selectedOptions }] };
    });
  },

  clearAndAddItem: (product: Product, selectedOptions?: SelectedOption[]) => {
    const cartItemId = generateCartItemId(product.id, selectedOptions);
    set({ items: [{ cartItemId, product, quantity: 1, note: '', selectedOptions }] });
  },

  removeItem: (cartItemId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.cartItemId !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId: string, quantity: number) => {
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((item) => item.cartItemId !== cartItemId)
          : state.items.map((item) =>
              item.cartItemId === cartItemId ? { ...item, quantity } : item
            ),
    }));
  },

  updateNote: (cartItemId: string, note: string) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.cartItemId === cartItemId ? { ...item, note } : item
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  totalPrice: () =>
    get().items.reduce((sum, item) => {
      let optionsPrice = 0;
      if (item.selectedOptions) {
        optionsPrice = item.selectedOptions.reduce((optSum, opt) => optSum + (Number(opt.price) || 0), 0);
      }
      return sum + (item.product.price + optionsPrice) * item.quantity;
    }, 0),
}));
