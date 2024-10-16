export interface ResourceMapper<T, R> {
    sync(resource: T): R;

    create(resource: T): R;

    update(resource: T, gpu: R): R;

    dispose(resource: T, gpu: R): void;
}
