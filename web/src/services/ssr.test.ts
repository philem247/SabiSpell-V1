import { describe, expect, it } from 'vitest';
import { calculateSSRDelta, clampSSR } from './ssr';

describe('calculateSSRDelta', () => {
  it('rewards a correct answer on a harder word (anchor +19)', () => {
    expect(calculateSSRDelta(1100, 1220, true, 24)).toBe(19);
  });

  it('penalises a wrong answer on an easier word (anchor -8)', () => {
    expect(calculateSSRDelta(1100, 980, false, 24)).toBe(-8);
  });

  it('uses the K factor', () => {
    expect(calculateSSRDelta(1100, 1220, true, 32)).toBe(26);
  });

  it('never pushes SSR above the max', () => {
    expect(calculateSSRDelta(2000, 2000, true, 24)).toBe(0);
  });

  it('never pushes SSR below the min', () => {
    expect(calculateSSRDelta(100, 100, false, 24)).toBe(0);
  });
});

describe('clampSSR', () => {
  it('clamps both ends', () => {
    expect(clampSSR(5000)).toBe(2000);
    expect(clampSSR(-5)).toBe(100);
    expect(clampSSR(1234)).toBe(1234);
  });
});
