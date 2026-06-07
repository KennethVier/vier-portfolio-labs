import { describe, expect, it } from 'vitest';
import { filterRunningTerms, runningTerms } from '../runningTerms.js';

describe('running terms helpers', () => {
  it('keeps beginner terminology available for the glossary page', () => {
    expect(runningTerms.length).toBeGreaterThan(10);
    expect(runningTerms.map((term) => term.term)).toContain('Easy run');
  });

  it('filters terms by name, category, or meaning', () => {
    expect(filterRunningTerms('tempo').map((term) => term.term)).toContain('Tempo run');
    expect(filterRunningTerms('recovery').map((term) => term.term)).toContain('Recovery run');
    expect(filterRunningTerms('')).toEqual(runningTerms);
  });
});
