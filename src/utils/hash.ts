/*
 * fnv-1a hash
 *
 * https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
 *
 * algorithm fnv-1a is
 *    hash := FNV_offset_basis
 *    for each byte_of_data to be hashed
 *      hash := hash XOR byte_of_data
 *     hash := hash × FNV_prime
 *    return hash
 */

export type Hash = number;

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function hash_number(v: number, prev: Hash = FNV_OFFSET_BASIS): Hash {
  let hash = prev;
  hash ^= v & 0xff;
  hash = (hash * FNV_PRIME) >>> 0;
  hash ^= (v >> 8) & 0xff;
  hash = (hash * FNV_PRIME) >>> 0;
  hash ^= (v >> 16) & 0xff;
  hash = (hash * FNV_PRIME) >>> 0;
  hash ^= (v >> 24) & 0xff;
  hash = (hash * FNV_PRIME) >>> 0;
  return hash;
}

export function hash_string(v: string, prev: Hash = FNV_OFFSET_BASIS): Hash {
  let hash = prev;
  for (let i = 0; i < v.length; i++) {
    hash = hash_number(v.charCodeAt(i), hash);
  }
  return hash;
}

interface HashMap<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): void;
}

type HashMapHasher<K> = (key: K) => Hash;
type HashMapEq<K> = (a: K, b: K) => boolean;

export function createHashMap<K, V>(
  hasher: HashMapHasher<K>,
  eq: HashMapEq<K> = (a, b) => a === b,
): HashMap<K, V> {
  const buckets = new Map<Hash, Array<[K, V]>>();

  return {
    get(key: K): V | undefined {
      const hash = hasher(key);
      const bucket = buckets.get(hash);
      if (!bucket) return undefined;
      const pair = bucket.find(([k]) => eq(key, k));
      return pair?.[1];
    },

    set(key: K, value: V): void {
      const hash = hasher(key);
      let bucket = buckets.get(hash);
      if (!bucket) {
        bucket = [];
        buckets.set(hash, bucket);
      }
      const index = bucket.findIndex(([k]) => eq(key, k));
      if (index >= 0) {
        bucket[index] = [key, value];
      } else {
        bucket.push([key, value]);
      }
    },

    has(key: K): boolean {
      const hash = hasher(key);
      const bucket = buckets.get(hash);
      if (!bucket) return false;
      return bucket.some(([k]) => eq(key, k));
    },

    delete(key: K): void {
      const hash = hasher(key);
      const bucket = buckets.get(hash);
      if (!bucket) return;
      const index = bucket.findIndex(([k]) => eq(key, k));
      if (index >= 0) {
        bucket.splice(index, 1);
        if (bucket.length === 0) {
          buckets.delete(hash);
        }
      }
    }
  };
}
