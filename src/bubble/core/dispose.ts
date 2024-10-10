export interface Disposable {
    dispose(): void;
}

export class Disposer {
    private readonly disposableChildren = new WeakMap<Disposable, Disposable[]>();
    private readonly disposableParents = new WeakMap<Disposable, Disposable>();

    register(parent: Disposable, child: Disposable) {
        if (this.disposableParents.has(child)) {
            throw new Error('Disposable already has a parent');
        }
        let children = this.disposableChildren.get(parent);
        if (!children) {
            children = [];
            this.disposableChildren.set(parent, children);
        }
        children.push(child);
        this.disposableParents.set(child, parent);
    }

    dispose(disposable: Disposable) {
        const children = this.disposableChildren.get(disposable);
        if (children) {
            for (const child of children) {
                this.dispose(child);
            }
        }
        try {
            disposable.dispose();
        } catch (e) {
            console.error(e);
        }
        this.disposableChildren.delete(disposable);
        this.disposableParents.delete(disposable);
    }

    static INSTANCE = new Disposer();

    static register(parent: Disposable, child: Disposable) {
        Disposer.INSTANCE.register(parent, child);
    }

    static dispose(disposable: Disposable) {
        Disposer.INSTANCE.dispose(disposable);
    }
}
