import { describe, expect, it } from 'vitest';
import { fmt } from '@/presentation/components/Dashboard/utils';

describe('Dashboard utils', () => {
  it('formatea null y undefined como guion', () => {
    expect(fmt(null)).toBe('—');
    expect(fmt(undefined)).toBe('—');
  });

  it('formatea valores no numéricos como guion', () => {
    expect(fmt('abc')).toBe('—');
  });

  it('formatea valores menores a mil', () => {
    expect(fmt(0)).toBe('$0');
    expect(fmt(250)).toBe('$250');
    expect(fmt(999)).toBe('$999');
  });

  it('formatea miles', () => {
    expect(fmt(1000)).toBe('$1.0k');
    expect(fmt(12500)).toBe('$12.5k');
  });

  it('formatea millones', () => {
    expect(fmt(1000000)).toBe('$1.0M');
    expect(fmt(2500000)).toBe('$2.5M');
  });
});
