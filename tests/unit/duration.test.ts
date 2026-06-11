import { parseDurationToSeconds } from '@/shared/utils/duration';
import { describe, expect, it } from 'vitest';

describe('parseDurationToSeconds', () => {
  it('parses seconds/minutes/hours/days', () => {
    expect(parseDurationToSeconds('30s')).toBe(30);
    expect(parseDurationToSeconds('15m')).toBe(15 * 60);
    expect(parseDurationToSeconds('2h')).toBe(2 * 60 * 60);
    expect(parseDurationToSeconds('30d')).toBe(30 * 24 * 60 * 60);
  });

  it('trims whitespace', () => {
    expect(parseDurationToSeconds('  10m  ')).toBe(600);
  });

  it('falls back on invalid input', () => {
    expect(parseDurationToSeconds('')).toBe(900);
    expect(parseDurationToSeconds('abc')).toBe(900);
    expect(parseDurationToSeconds('10x')).toBe(900);
    expect(parseDurationToSeconds('m10')).toBe(900);
  });

  it('honors a custom fallback', () => {
    expect(parseDurationToSeconds('nope', 60)).toBe(60);
  });
});
