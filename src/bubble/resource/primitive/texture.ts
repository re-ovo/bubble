import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";

export abstract class Texture implements Versioned {
    version: number = 0;

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }
}

export class Texture2D {
    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}
