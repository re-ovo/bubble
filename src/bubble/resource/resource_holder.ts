/**
 * 用于标记需要更新的对象
 */
export interface ResourceHolder {
    needsUpdate: boolean;

    update(): void;
}

// 用于标记已经添加代理的对象
const resourceHolderSymbol = Symbol('resourceHolder');

export function resourceHolderOf<T extends ResourceHolder>(delegate: T, recursive = false): T {
    if (resourceHolderSymbol in delegate) {
        // 已经添加过代理
        return delegate;
    }

    const makeProxy = (target: any): any => {
        if (target === null || typeof target !== 'object' || resourceHolderSymbol in target) {
            return target;
        }
        const proxied = new Proxy(target, {
            set(target, p, value, receiver) {
                delegate.needsUpdate = true;
                return Reflect.set(target, p, value, receiver);
            },
            get(target, p, receiver) {
                if (recursive) {
                    const value = Reflect.get(target, p, receiver);
                    if (typeof value === 'object' && value !== null) {
                        return makeProxy(value); // 递归代理
                    }
                }
                return Reflect.get(target, p, receiver);
            }
        });

        // 标记已经添加代理
        Object.defineProperty(proxied, resourceHolderSymbol, {
            value: true
        });

        return proxied;
    }

    return makeProxy(delegate);
}
