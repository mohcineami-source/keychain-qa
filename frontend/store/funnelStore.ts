import { create } from "zustand";
import type { PlateLetter, PlateStyleId } from "@/data/plateStyles";
import { calculateTotal } from "@/lib/pricing";

export type FunnelStep = 1 | 2 | 3 | 4 | 5;

export interface FunnelItem {
  id: string;
  plateStyle: PlateStyleId;
  plateLetter?: PlateLetter;
  plateNumber?: string;
}

export interface SubmittedOrder {
  orderNumber: string;
  total: number;
  currency: string;
  quantity: number;
  whatsappUrl: string;
}

interface FunnelState {
  step: FunnelStep;
  items: FunnelItem[];
  submitted: SubmittedOrder | null;

  goToStep: (step: FunnelStep) => void;
  startSelection: () => void;
  addItem: (item: FunnelItem) => void;
  updateItem: (id: string, patch: Partial<FunnelItem>) => void;
  removeItem: (id: string) => void;
  beginAddAnother: () => void;
  goToCheckout: () => void;
  setSubmitted: (order: SubmittedOrder) => void;
  reset: () => void;

  quantity: () => number;
  total: () => number;
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `item-${Date.now()}-${counter}`;
}

export const newItemId = nextId;

export const useFunnelStore = create<FunnelState>((set, get) => ({
  step: 1,
  items: [],
  submitted: null,

  goToStep: (step) => set({ step }),

  startSelection: () => set({ step: 2 }),

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),

  updateItem: (id, patch) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((it) => it.id !== id) })),

  // Step 3 -> Step 2 loop: simply go back to selection to add another keychain.
  beginAddAnother: () => set({ step: 2 }),

  goToCheckout: () => set({ step: 4 }),

  setSubmitted: (order) => set({ submitted: order, step: 5 }),

  reset: () => set({ step: 1, items: [], submitted: null }),

  quantity: () => get().items.length,
  total: () => calculateTotal(get().items.length),
}));
