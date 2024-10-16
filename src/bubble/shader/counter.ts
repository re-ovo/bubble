export function providerWGSLCounterScope<T>(scope: () => T): T {
    if(counterContext != null) {
        throw new Error(':( counterContext is not null, are you nesting counter scopes?');
    }

    counterContext = new CounterContext();
    let result = scope();
    counterContext = null;
    return result;
}

let counterContext: CounterContext | null = null;

class CounterContext {
    private locationCounter: number = 0;
    private readonly bindingGroupCounter: Record<number, number> = {};

    constructor() {
        this.locationCounter = 0;
        this.bindingGroupCounter = {};
    }

    allocateLocation(): number {
        return this.locationCounter++;
    }

    allocateBindingGroup(group: number): number {
        if(this.bindingGroupCounter[group] == null) {
            this.bindingGroupCounter[group] = 0;
        }
        return this.bindingGroupCounter[group]++;
    }
}

export function autoBinding(group: number): number {
    if(counterContext == null) throw new Error('counterContext is null');
    return counterContext.allocateBindingGroup(group);
}

export function autoLocation(): number {
    if(counterContext == null) throw new Error('counterContext is null');
    return counterContext.allocateLocation();
}
