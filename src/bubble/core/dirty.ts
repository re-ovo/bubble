export interface DirtyObject<E> {
    isDirty(flag: E): boolean;
    clearDirty(flag: E): void;
    setDirty(flag: E): void;
}
