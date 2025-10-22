/**
 * In-memory catalog for demo purposes.
 * Production implementations should use a database or Stripe Prices API.
 */

export interface CatalogItem {
  sku: string;
  name: string;
  amount: number; // Amount in smallest currency unit (e.g., cents for USD)
  currency: string;
}

export interface CartLine {
  sku: string;
  quantity: number;
}

export interface ComputedTotal {
  amount: number;
  currency: string;
  lines: Array<{
    sku: string;
    name: string;
    quantity: number;
    unitAmount: number;
    lineTotal: number;
  }>;
}

// Demo catalog - replace with DB or Stripe Prices in production
const CATALOG: Record<string, CatalogItem> = {
  sku_basic: {
    sku: 'sku_basic',
    name: 'Basic Plan',
    amount: 999, // $9.99
    currency: 'usd',
  },
  sku_pro: {
    sku: 'sku_pro',
    name: 'Pro Plan',
    amount: 2999, // $29.99
    currency: 'usd',
  },
  sku_enterprise: {
    sku: 'sku_enterprise',
    name: 'Enterprise Plan',
    amount: 9999, // $99.99
    currency: 'usd',
  },
};

/**
 * Computes the total for a cart from the catalog.
 * Validates that all SKUs exist, prevents mixed currencies, and ensures total > 0.
 */
export function computeCartTotal(
  lines: CartLine[],
  preferredCurrency?: string
): ComputedTotal {
  if (!lines || lines.length === 0) {
    throw new Error('Cart cannot be empty');
  }

  let totalAmount = 0;
  let currency: string | null = null;
  const computedLines: ComputedTotal['lines'] = [];

  for (const line of lines) {
    if (line.quantity <= 0) {
      throw new Error(`Invalid quantity for SKU ${line.sku}: ${line.quantity}`);
    }

    const item = CATALOG[line.sku];
    if (!item) {
      throw new Error(`Unknown SKU: ${line.sku}`);
    }

    // Validate currency consistency
    if (currency === null) {
      currency = preferredCurrency || item.currency;
    } else if (item.currency !== currency) {
      throw new Error(
        `Mixed currencies not supported. Expected ${currency}, got ${item.currency} for SKU ${line.sku}`
      );
    }

    const lineTotal = item.amount * line.quantity;
    totalAmount += lineTotal;

    computedLines.push({
      sku: line.sku,
      name: item.name,
      quantity: line.quantity,
      unitAmount: item.amount,
      lineTotal,
    });
  }

  if (totalAmount <= 0) {
    throw new Error('Cart total must be greater than 0');
  }

  return {
    amount: totalAmount,
    currency: currency!,
    lines: computedLines,
  };
}

/**
 * Get catalog item by SKU (for reference)
 */
export function getCatalogItem(sku: string): CatalogItem | undefined {
  return CATALOG[sku];
}

/**
 * Get all catalog items (for reference)
 */
export function getAllCatalogItems(): CatalogItem[] {
  return Object.values(CATALOG);
}
