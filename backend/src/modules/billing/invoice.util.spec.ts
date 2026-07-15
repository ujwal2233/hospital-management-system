import { computeTotals, deriveStatus } from './invoice.util';
import { InvoiceStatus } from '../../common/enums';

describe('computeTotals', () => {
  it('computes subtotal from line items', () => {
    const result = computeTotals(
      [{ description: 'Consultation', quantity: 1, unitPrice: 500 }],
      0,
      0,
    );
    expect(result.subtotal).toBe(500);
    expect(result.total).toBe(500);
  });

  it('applies tax rate correctly', () => {
    const result = computeTotals(
      [{ description: 'Lab test', quantity: 2, unitPrice: 100 }],
      18, // 18% GST
      0,
    );
    expect(result.subtotal).toBe(200);
    expect(result.taxAmount).toBeCloseTo(36);
    expect(result.total).toBeCloseTo(236);
  });

  it('applies discount correctly', () => {
    const result = computeTotals(
      [{ description: 'Room charge', quantity: 3, unitPrice: 1000 }],
      0,
      10, // ₹10 flat discount
    );
    expect(result.subtotal).toBe(3000);
    expect(result.discount).toBe(10);
    expect(result.total).toBe(2990);
  });

  it('throws on negative total after discount', () => {
    expect(() =>
      computeTotals([{ description: 'Item', quantity: 1, unitPrice: 5 }], 0, 100),
    ).toThrow();
  });

  it('throws on empty items', () => {
    expect(() => computeTotals([], 0, 0)).toThrow();
  });
});

describe('deriveStatus', () => {
  it('returns ISSUED when no payment', () => {
    expect(deriveStatus(1000, 0)).toBe(InvoiceStatus.ISSUED);
  });

  it('returns PARTIALLY_PAID when partial', () => {
    expect(deriveStatus(1000, 500)).toBe(InvoiceStatus.PARTIALLY_PAID);
  });

  it('returns PAID when fully paid', () => {
    expect(deriveStatus(1000, 1000)).toBe(InvoiceStatus.PAID);
  });
});
