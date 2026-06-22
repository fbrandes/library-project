import { describe, expect, it } from 'vitest';

import { countBooks, isActiveRentalState, isOrderState, orderStates } from './order';
import { orderFixture } from '../test/fixtures';

describe('order model helpers', () => {
  it('detects supported order states', () => {
    expect(isOrderState('PLACED')).toBe(true);
    expect(isOrderState('MISSING')).toBe(false);
    expect(orderStates).toContain('LATE_FOR_RETURN');
  });

  it('detects active rental states', () => {
    expect(isActiveRentalState('PLACED')).toBe(true);
    expect(isActiveRentalState('LATE_FOR_RETURN')).toBe(true);
    expect(isActiveRentalState('RETURNED')).toBe(false);
    expect(isActiveRentalState('COMPLETED')).toBe(false);
  });

  it('counts books in an order', () => {
    expect(countBooks(orderFixture())).toBe(1);
  });
});
