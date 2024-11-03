export type Hash = number;

export interface Hashable {
    hash(hasher: Hasher): Hash;
}

// FNV-1a Hash
export class Hasher {
    private hash: number;

    constructor(hash?: Hash) {
        this.hash = hash ?? 0x811c9dc5;
    }

    string(str: string): void {
        for (const char of str) {
            this.hash ^= char.charCodeAt(0);
            this.hash = Math.imul(this.hash, 0x01000193);
        }
    }

    int32(num: number): void {
        this.hash ^= num & 0xff;
        this.hash = Math.imul(this.hash, 0x01000193);
        this.hash ^= (num >> 8) & 0xff;
        this.hash = Math.imul(this.hash, 0x01000193);
        this.hash ^= (num >> 16) & 0xff;
        this.hash = Math.imul(this.hash, 0x01000193);
        this.hash ^= (num >> 24) & 0xff;
        this.hash = Math.imul(this.hash, 0x01000193);
    }

    float64(num: number): void {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, num, true);
        for (let i = 0; i < 8; i++) {
            this.hash ^= view.getUint8(i);
            this.hash = Math.imul(this.hash, 0x01000193);
        }
    }

    boolean(bool: boolean): void {
        this.hash ^= bool ? 1 : 0;
        this.hash = Math.imul(this.hash, 0x01000193);
    }

    object(obj: Hashable): void {
        obj.hash(this);
    }

    get(): Hash {
        return this.hash >>> 0;
    }
}
