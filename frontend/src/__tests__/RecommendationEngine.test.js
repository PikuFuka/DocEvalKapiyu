// src/__tests__/RecommendationEngine.test.js

import { generateRecommendations } from '../services/RecommendationEngine';

describe('generateRecommendations', () => {
  it('returns empty array for null input', () => {
    expect(generateRecommendations(null)).toEqual([]);
  });

  it('returns empty array when subscores is missing', () => {
    expect(generateRecommendations({})).toEqual([]);
  });

  it('returns success item when all scores >= 80%', () => {
    const data = {
      subscores: {
        'KRA I': [
          { key: 'A', name: 'Teaching', score: 50, cap: 60 },   // 83%
          { key: 'B', name: 'Materials', score: 26, cap: 30 },  // 87%
          { key: 'C', name: 'Mentorship', score: 9, cap: 10 },  // 90%
        ],
      },
    };
    const result = generateRecommendations(data);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Success');
    expect(result[0].color).toBe('emerald');
  });

  it('identifies critical gaps (< 50%)', () => {
    const data = {
      subscores: {
        'KRA II': [
          { key: 'A', name: 'Research', score: 10, cap: 100 },  // 10% → Critical
        ],
      },
    };
    const result = generateRecommendations(data);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const critical = result.find(r => r.type === 'Critical Gap');
    expect(critical).toBeDefined();
    expect(critical.color).toBe('rose');
    expect(critical.gap).toBe(90);
  });

  it('identifies warnings (50-80%)', () => {
    const data = {
      subscores: {
        'KRA I': [
          { key: 'A', name: 'Teaching', score: 43, cap: 60 },  // ~72% → Warning
        ],
      },
    };
    const result = generateRecommendations(data);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const warning = result.find(r => r.type === 'Warning');
    expect(warning).toBeDefined();
    expect(warning.color).toBe('amber');
  });

  it('sorts by gap size descending', () => {
    const data = {
      subscores: {
        'KRA I': [
          { key: 'A', name: 'Teaching', score: 43, cap: 60 },   // gap=17
          { key: 'B', name: 'Materials', score: 0, cap: 30 },   // gap=30
        ],
      },
    };
    const result = generateRecommendations(data);
    expect(result.length).toBe(2);
    // Largest gap first
    expect(result[0].gap).toBeGreaterThanOrEqual(result[1].gap);
    expect(result[0].gap).toBe(30);
    expect(result[1].gap).toBe(17);
  });

  it('skips subscores with cap of 0', () => {
    const data = {
      subscores: {
        'KRA I': [
          { key: 'A', name: 'Teaching', score: 0, cap: 0 },  // Should skip (div by zero)
        ],
      },
    };
    const result = generateRecommendations(data);
    // Should be the "success" fallback since no actionable items were added
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Success');
  });
});
