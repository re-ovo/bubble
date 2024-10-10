/**
 * 用于标记需要更新的对象
 */
export interface Updatable {
    needsUpdate: boolean;

    update(): void;
}
