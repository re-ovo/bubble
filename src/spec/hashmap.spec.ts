import { describe, it, expect } from 'vitest';
import { createHashMap, hash_string } from '../utils/hash';

// Define a simple test suite for the HashMap

describe('HashMap', () => {
  it('should set and get values correctly', () => {
    const map = createHashMap(hash_string);
    map.set('key1', 'value1');
    expect(map.get('key1')).toBe('value1');
  });

  it('should update existing keys', () => {
    const map = createHashMap(hash_string);
    map.set('key1', 'value1');
    map.set('key1', 'value2');
    expect(map.get('key1')).toBe('value2');
  });

  it('should delete keys correctly', () => {
    const map = createHashMap(hash_string);
    map.set('key1', 'value1');
    map.delete('key1');
    expect(map.get('key1')).toBeUndefined();
  });

  it('should handle hash collisions', () => {
    const map = createHashMap(() => 1); // All keys will have the same hash
    map.set('key1', 'value1');
    map.set('key2', 'value2');
    expect(map.get('key1')).toBe('value1');
    expect(map.get('key2')).toBe('value2');
  });
});
