/**
 * Pricing logic. MUST mirror backend pricing exactly.
 * First keychain: 160 QAR. Each extra keychain: +100 QAR. Delivery included.
 */

export const FIRST_ITEM_PRICE = 160;
export const EXTRA_ITEM_PRICE = 100;

export function calculateTotal(quantity: number): number {
  if (quantity <= 0) return 0;
  return FIRST_ITEM_PRICE + (quantity - 1) * EXTRA_ITEM_PRICE;
}

/** Price of a single item by its 1-based index in the order. */
export function itemPrice(itemNumber: number): number {
  return itemNumber <= 1 ? FIRST_ITEM_PRICE : EXTRA_ITEM_PRICE;
}
