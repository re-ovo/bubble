import type {Versioned} from "@/bubble/resource/versioned";

export interface ResourceMapper<T extends Versioned, R> {
    sync(resource: T): R;

    create(resource: T): R;

    update(resource: T, gpu: R): R;

    dispose(resource: T, gpu: R): void;
}
