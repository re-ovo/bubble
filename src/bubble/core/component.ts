import type {Entity} from "@/bubble/core/entity";

abstract class Component {
    readonly entity: Entity;

    constructor(entity: Entity) {
        this.entity = entity;
    }

    update?(deltaTime: number): void;
}

export {Component};
