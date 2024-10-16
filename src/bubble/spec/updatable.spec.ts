import { describe, it, expect, vi } from 'vitest';
import {resourceHolderOf, type ResourceHolder} from "@/bubble/resource/resource_holder";

describe('updatable', () => {
    it('should mark object as needing update when a property is set', () => {
        class Test implements ResourceHolder {
            needsUpdate = false;
            someProperty = 0;

            update() {
                this.needsUpdate = false
            }
        }

        const proxy = resourceHolderOf(new Test());

        proxy.someProperty = 42;
        expect(proxy.needsUpdate).toBe(true);
    });

    it('should not re-proxy an already proxied object', () => {
        class Test implements ResourceHolder {
            needsUpdate = false;
            someProperty = 0;

            update() {
                this.needsUpdate = false
            }
        }

        const obj = new Test();
        const proxy = resourceHolderOf(obj);
        const proxy2 = resourceHolderOf(proxy);

        expect(proxy).toBe(proxy2);
    });

    it('should recursively proxy nested objects if recursive flag is true', () => {
        class Test implements ResourceHolder {
            needsUpdate = false;
            nested = {
                someProperty: 0
            };

            update() {
                this.needsUpdate = false
            }
        }

        const proxy = resourceHolderOf(new Test(), true);
        proxy.nested.someProperty = 42;
        expect(proxy.needsUpdate).toBe(true);
    });

    it('should not recursively proxy nested objects if recursive flag is false', () => {
        class Test implements ResourceHolder {
            needsUpdate = false;
            nested = {
                someProperty: 0
            };

            update() {
                this.needsUpdate = false
            }
        }

        const proxy = resourceHolderOf(new Test(), false);
        proxy.nested.someProperty = 42;
        expect(proxy.needsUpdate).toBe(false);
    });
});
