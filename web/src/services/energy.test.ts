import { describe, expect, it } from 'vitest';
import { calculateEnergyRefill, deductEnergy } from './energy';

const MIN = 60 * 1000;
const INTERVAL = 15 * MIN;

describe('calculateEnergyRefill', () => {
  it('at cap, resets the timestamp to now', () => {
    expect(calculateEnergyRefill(5, 0, 1_000_000)).toEqual({ energy: 5, lastRefillTs: 1_000_000 });
  });

  it('adds one pip per 15 minutes and keeps the leftover time', () => {
    expect(calculateEnergyRefill(1, 0, 31 * MIN)).toEqual({ energy: 3, lastRefillTs: 2 * INTERVAL });
  });

  it('does nothing before a full interval has passed', () => {
    expect(calculateEnergyRefill(2, 1000, 1500)).toEqual({ energy: 2, lastRefillTs: 1000 });
  });

  it('caps energy and resets the timestamp when fully refilled', () => {
    expect(calculateEnergyRefill(1, 0, 10 * INTERVAL)).toEqual({ energy: 5, lastRefillTs: 10 * INTERVAL });
  });

  it('restarts the timer when the clock moves backwards', () => {
    expect(calculateEnergyRefill(2, 5_000_000, 1_000_000)).toEqual({ energy: 2, lastRefillTs: 1_000_000 });
  });
});

describe('deductEnergy', () => {
  it('deducts when enough energy and keeps the running timer', () => {
    expect(deductEnergy(3, 1, 0, 0)).toEqual({ success: true, energy: 2, lastRefillTs: 0 });
  });

  it('starts the timer when deducting from a full bar', () => {
    expect(deductEnergy(5, 1, 0, 1000)).toEqual({ success: true, energy: 4, lastRefillTs: 1000 });
  });

  it('fails without changing energy when there is not enough', () => {
    expect(deductEnergy(1, 2, 0, 0)).toEqual({ success: false, energy: 1, lastRefillTs: 0 });
  });

  it('refills before checking', () => {
    expect(deductEnergy(0, 2, 0, 2 * INTERVAL)).toEqual({ success: true, energy: 0, lastRefillTs: 2 * INTERVAL });
  });

  it('a zero amount changes nothing', () => {
    expect(deductEnergy(3, 0, 0, 0)).toEqual({ success: true, energy: 3, lastRefillTs: 0 });
  });

  it('a negative amount never adds energy', () => {
    expect(deductEnergy(3, -2, 0, 0)).toEqual({ success: true, energy: 3, lastRefillTs: 0 });
  });
});
