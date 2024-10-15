/**
 * 用于标记需要更新的对象
 */
export interface Updatable {
    needsUpdate: boolean;

    update(): void;
}

const updatableSymbol = Symbol('updatable'); // 用于标记已经添加代理的对象

/**
 * 为Updatable对象添加代理，当对象的属性被修改时，自动标记为需要更新
 *
 * @param delegate 要添加代理的对象
 * @param recursive 是否递归代理对象的属性
 */
export function updatable<T extends Updatable>(delegate: T, recursive = false): T {
    if (updatableSymbol in delegate) {
        // 已经添加过代理
        return delegate;
    }

    const makeProxy = (target: any): any => {
        if(target === null || typeof target !== 'object' || updatableSymbol in target) {
            return target;
        }
        const proxied =  new Proxy(target, {
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
        Object.defineProperty(proxied, updatableSymbol, {
            value: true
        });

        return proxied;
    }

    return makeProxy(delegate);
}
