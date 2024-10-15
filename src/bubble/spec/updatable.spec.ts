import { describe, it, expect, vi } from 'vitest';
import {updatable, type Updatable} from "@/bubble/core/updatable";

describe('updatable', () => {
    it('should mark object as needing update when a property is set', () => {
        class Test implements Updatable {
            needsUpdate = false;
            someProperty = 0;

            update() {
                this.needsUpdate = false
            }
        }

        const proxy = updatable(new Test());

        proxy.someProperty = 42;
        expect(proxy.needsUpdate).toBe(true);
    });

    it('should not re-proxy an already proxied object', () => {
        class Test implements Updatable {
            needsUpdate = false;
            someProperty = 0;

            update() {
                this.needsUpdate = false
            }
        }

        const obj = new Test();
        const proxy = updatable(obj);
        const proxy2 = updatable(proxy);

        expect(proxy).toBe(proxy2);
    });

    it('should recursively proxy nested objects if recursive flag is true', () => {
        class Test implements Updatable {
            needsUpdate = false;
            nested = {
                someProperty: 0
            };

            update() {
                this.needsUpdate = false
            }
        }

        const proxy = updatable(new Test(), true);
        proxy.nested.someProperty = 42;
        expect(proxy.needsUpdate).toBe(true);
    });

    it('should not recursively proxy nested objects if recursive flag is false', () => {
        class Test implements Updatable {
            needsUpdate = false;
            nested = {
                someProperty: 0
            };

            update() {
                this.needsUpdate = false
            }
        }

        const proxy = updatable(new Test(), false);
        proxy.nested.someProperty = 42;
        expect(proxy.needsUpdate).toBe(false);
    });
});
