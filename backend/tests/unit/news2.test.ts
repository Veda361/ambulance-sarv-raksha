import { describe, it, expect } from 'vitest';
import { calculateNEWS2 } from '../../src/modules/clinical/news2.js';

describe('NEWS2 Clinical Scoring Engine', () => {
  it('calculates normal score (0) for healthy baseline vitals', () => {
    const result = calculateNEWS2({
      respiratoryRate: 16,
      spo2Percent: 98,
      systolicBp: 120,
      heartRate: 72,
      temperatureC: 37.0,
    });

    expect(result.totalScore).toBe(0);
    expect(result.acuityLevel).toBe('LOW');
    expect(result.isCriticalAlert).toBe(false);
    expect(result.redFlags).toHaveLength(0);
  });

  it('triggers critical alert when SpO2 drops to 90% (extreme red flag)', () => {
    const result = calculateNEWS2({
      respiratoryRate: 20,
      spo2Percent: 90, // score 3 + red flag
      systolicBp: 115,
      heartRate: 80,
      temperatureC: 36.8,
    });

    expect(result.scoreBreakdown.spo2Percent).toBe(3);
    expect(result.isCriticalAlert).toBe(true);
    expect(result.acuityLevel).toBe('HIGH');
    expect(result.redFlags).toContain('Severe Hypoxia (SpO2 <= 91%)');
  });

  it('triggers critical alert when aggregate score reaches or exceeds 7', () => {
    const result = calculateNEWS2({
      respiratoryRate: 22, // score 2
      spo2Percent: 93,     // score 2
      systolicBp: 98,      // score 2
      heartRate: 115,      // score 2
      temperatureC: 38.5,  // score 1
    });

    expect(result.totalScore).toBe(9);
    expect(result.acuityLevel).toBe('HIGH');
    expect(result.isCriticalAlert).toBe(true);
  });
});
