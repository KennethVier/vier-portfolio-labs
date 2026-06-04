import { describe, expect, it } from 'vitest';
import { parseRunText } from '../ocrParser.js';

describe('parseRunText', () => {
  it('extracts kilometer distance, duration, and pace from common running summary text', () => {
    const result = parseRunText('Morning Run Distance 5.12 km Time 36:44 Pace 7:10 /km');

    expect(result.values.distanceKm).toBe(5.12);
    expect(result.values.durationMinutes).toBe(36);
    expect(result.values.pace).toBe('7:10');
  });

  it('converts miles to kilometers for imported screenshots', () => {
    const result = parseRunText('Nike Run 3.10 mi duration 00:31:20 average pace 10:06 /mi');

    expect(result.values.distanceKm).toBeCloseTo(4.99, 2);
    expect(result.values.durationMinutes).toBe(31);
    expect(result.values.pace).toBe('10:06');
  });

  it('returns empty values when OCR text does not contain run metrics', () => {
    const result = parseRunText('Great effort today, keep going');

    expect(result.values).toEqual({});
    expect(result.rawText).toBe('Great effort today, keep going');
  });
});