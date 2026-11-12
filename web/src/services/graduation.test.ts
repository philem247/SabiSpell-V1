import { describe, expect, it } from 'vitest';
import { formatPassRate, isGraduationUnlocked, processGraduationResult } from './graduation';

describe('isGraduationUnlocked', () => {
  it('needs 50 words in the collection', () => {
    expect(isGraduationUnlocked(Array.from({ length: 49 }, (_, i) => `w${i}`))).toBe(false);
    expect(isGraduationUnlocked(Array.from({ length: 50 }, (_, i) => `w${i}`))).toBe(true);
  });
});

describe('processGraduationResult', () => {
  it('passes at 75% and awards the bonus', () => {
    const r = processGraduationResult(15, 20);
    expect(r.passed).toBe(true);
    expect(r.xpBonus).toBe(1000);
    expect(r.coinBonus).toBe(400);
    expect(r.percentage).toBe(0.75);
  });

  it('fails below 75% with no bonus', () => {
    const r = processGraduationResult(14, 20);
    expect(r.passed).toBe(false);
    expect(r.xpBonus).toBe(0);
    expect(r.coinBonus).toBe(0);
  });

  it('defaults the exam length to 20 words', () => {
    expect(processGraduationResult(20).total).toBe(20);
  });

  it('clamps a score above the total', () => {
    expect(processGraduationResult(25, 20)).toEqual(
      expect.objectContaining({ score: 20, percentage: 1, passed: true }),
    );
  });

  it('clamps a negative score to zero', () => {
    expect(processGraduationResult(-3, 20)).toEqual(
      expect.objectContaining({ score: 0, percentage: 0, passed: false }),
    );
  });

  it('clamps a negative total to zero', () => {
    expect(processGraduationResult(5, -4)).toEqual(
      expect.objectContaining({ total: 0, score: 0, percentage: 0, passed: false }),
    );
  });

  it('handles an empty exam', () => {
    const r = processGraduationResult(0, 0);
    expect(r.percentage).toBe(0);
    expect(r.passed).toBe(false);
  });
});

describe('formatPassRate', () => {
  it('formats a percentage', () => {
    expect(formatPassRate(0.75)).toBe('75%');
  });
});
