/**
 * Money utility for integer-cents arithmetic.
 * All monetary values are stored as integers in the smallest currency unit.
 * e.g., ₹1,499.00 = 149900 paise
 */
export class Money {
  constructor(
    private readonly cents: number,
    private readonly currency: string = 'INR',
  ) {}

  static fromCents(cents: number, currency = 'INR'): Money {
    return new Money(Math.round(cents), currency);
  }

  static fromAmount(amount: number, currency = 'INR'): Money {
    return new Money(Math.round(amount * 100), currency);
  }

  static zero(currency = 'INR'): Money {
    return new Money(0, currency);
  }

  get toCents(): number {
    return this.cents;
  }

  get toAmount(): number {
    return this.cents / 100;
  }

  get currencyCode(): string {
    return this.currency;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor), this.currency);
  }

  /**
   * Calculate percentage. e.g., applyPercentage(1500) for 15.00% commission
   * Percentage is in basis points (1500 = 15.00%)
   */
  applyBasisPoints(basisPoints: number): Money {
    return new Money(Math.round((this.cents * basisPoints) / 10000), this.currency);
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  greaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  lessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  /**
   * Format for display. e.g., "₹1,499.00"
   */
  format(locale = 'en-IN'): string {
    const currencyMap: Record<string, string> = { INR: 'INR', USD: 'USD', EUR: 'EUR' };
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyMap[this.currency] || this.currency,
    }).format(this.toAmount);
  }

  /**
   * For API responses: { amountInCents, amountDisplay, currency }
   */
  toJSON() {
    return {
      amountInCents: this.cents,
      amountDisplay: this.format(),
      currency: this.currency,
    };
  }

  toString(): string {
    return this.format();
  }
}
