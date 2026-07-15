import { InvoiceStatus } from '../../common/enums';

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceTotals {
  items: (InvoiceLineInput & { amount: number })[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** BR-3: total = subtotal − discount + tax; tax applies to the discounted base (GST). */
export function computeTotals(
  lines: InvoiceLineInput[],
  taxRate: number,
  discount: number,
): InvoiceTotals {
  if (!lines || lines.length === 0) {
    throw new Error('Invoice must have at least one line item');
  }
  const items = lines.map((l) => ({ ...l, amount: round2(l.quantity * l.unitPrice) }));
  const subtotal = round2(items.reduce((sum, i) => sum + i.amount, 0));
  if (discount > subtotal) {
    throw new Error('Discount cannot exceed the subtotal');
  }
  const taxable = subtotal - discount;
  const taxAmount = round2((taxable * taxRate) / 100);
  return {
    items,
    subtotal,
    discount: round2(discount),
    taxRate,
    taxAmount,
    total: round2(taxable + taxAmount),
  };
}

/** Payment status derives from how much of the total has been received (using integer cent comparison). */
export function deriveStatus(total: number, amountPaid: number): InvoiceStatus {
  const paidCents = Math.round(amountPaid * 100);
  const totalCents = Math.round(total * 100);
  if (paidCents <= 0) return InvoiceStatus.ISSUED;
  return paidCents >= totalCents ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
}
