import { describe, expect, it } from 'vitest';
import { fmt } from '@/presentation/components/Dashboard/Estado/constants';

describe('Dashboard Estado constants', () => {
  it('formatea valores vacíos como guion', () => {
    expect(fmt(null)).toBe('—');
    expect(fmt(undefined)).toBe('—');
  });

  it('formatea millones', () => {
    expect(fmt(1000000)).toBe('$1.0M');
  });

  it('formatea miles', () => {
    expect(fmt(1000)).toBe('$1.0k');
  });

  it('formatea valores menores a mil', () => {
    expect(fmt(250)).toBe('$250');
  });
});
