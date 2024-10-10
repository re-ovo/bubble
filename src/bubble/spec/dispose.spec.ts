import { describe, it, expect, vi } from 'vitest';
import { type Disposable, Disposer } from '@/bubble/core/dispose'; // 请替换为你的实际模块路径

class MockDisposable implements Disposable {
    dispose = vi.fn();
}

describe('Disposer', () => {
    it('should register and dispose a single child', () => {
        const parent = new MockDisposable();
        const child = new MockDisposable();

        Disposer.register(parent, child);
        Disposer.dispose(parent);

        expect(child.dispose).toHaveBeenCalledOnce();
        expect(parent.dispose).toHaveBeenCalledOnce();
    });

    it('should throw an error if a child is registered with multiple parents', () => {
        const parent1 = new MockDisposable();
        const parent2 = new MockDisposable();
        const child = new MockDisposable();

        Disposer.register(parent1, child);

        expect(() => Disposer.register(parent2, child)).toThrow('Disposable already has a parent');
    });

    it('should dispose children recursively', () => {
        const parent = new MockDisposable();
        const child1 = new MockDisposable();
        const child2 = new MockDisposable();

        Disposer.register(parent, child1);
        Disposer.register(child1, child2);

        Disposer.dispose(parent);

        expect(child2.dispose).toHaveBeenCalledOnce();
        expect(child1.dispose).toHaveBeenCalledOnce();
        expect(parent.dispose).toHaveBeenCalledOnce();
    });

    it('should handle dispose errors gracefully', () => {
        const parent = new MockDisposable();
        parent.dispose.mockImplementation(() => {
            throw new Error('Dispose failed');
        });

        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        Disposer.dispose(parent);

        expect(spy).toHaveBeenCalledWith(new Error('Dispose failed'));
        spy.mockRestore();
    });
});
