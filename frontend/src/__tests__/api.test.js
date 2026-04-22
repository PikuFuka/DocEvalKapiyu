// src/__tests__/api.test.js

import { extractUploadsArray } from '../services/api';


describe('extractUploadsArray', () => {
  it('returns the same array if payload is already an array', () => {
    const input = [{ id: 1 }, { id: 2 }];
    expect(extractUploadsArray(input)).toBe(input);
  });

  it('extracts .results from paginated response', () => {
    const input = { results: [{ id: 1 }], count: 1 };
    expect(extractUploadsArray(input)).toEqual([{ id: 1 }]);
  });

  it('returns empty array for null', () => {
    expect(extractUploadsArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(extractUploadsArray(undefined)).toEqual([]);
  });

  it('returns empty array for object without results', () => {
    expect(extractUploadsArray({ data: 'something' })).toEqual([]);
  });

  it('returns empty array for non-object/non-array', () => {
    expect(extractUploadsArray('string')).toEqual([]);
    expect(extractUploadsArray(42)).toEqual([]);
  });
});
