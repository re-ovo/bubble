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
