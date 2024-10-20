import {Component, Transform} from "@/bubble/core/system";
import {vec3} from "wgpu-matrix";
import {angleToRadians} from "@/bubble/math/maths";

export class FPSController extends Component {
    private readonly pressingKeys = new Set<string>()

    get transform(): Transform {
        return this.entity!.getComponent(Transform)!;
    }

    init(element: HTMLCanvasElement) {
        element.addEventListener('click', async () => {
            if (!document.pointerLockElement) {
                element.requestPointerLock()
            }
        })

        const moveHandler = (e: MouseEvent) => {
            this.move(e)
        }
        const keydownHandler = (e: KeyboardEvent) => {
            this.keyEvent(e)
        }
        const keyupHandler = (e: KeyboardEvent) => {
            this.pressingKeys.delete(e.key)
        }
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement) {
                element.addEventListener('mousemove', moveHandler)
                document.addEventListener('keydown', keydownHandler)
                document.addEventListener('keyup', keyupHandler)
            } else {
                element.removeEventListener('mousemove', moveHandler)
                document.removeEventListener('keydown', keydownHandler)
                document.removeEventListener('keyup', keyupHandler)
            }
        })
    }

    move(e: MouseEvent) {
        const sensitivity = 10;

        const yaw = e.movementX * sensitivity;
        const pitch = e.movementY * sensitivity;

        this.transform.rotateYawPitch(angleToRadians(-yaw), angleToRadians(-pitch))
    }

    keyEvent(e: KeyboardEvent) {
        this.pressingKeys.add(e.key)
        e.preventDefault()
    }

    update(deltaTime: number) {
        for (const key of this.pressingKeys) {
            this.handleKey(key)
        }
    }

    handleKey(key: string) {
        const forward = this.transform.forwardDirection
        const right = this.transform.rightDirection
        const speed = 2.0
        switch (key) {
            case 'w':
                this.transform.translate(vec3.create(forward[0] * speed, 0, forward[2] * speed))
                break;
            case 'a':
                this.transform.translate(vec3.create(-right[0] * speed, 0, -right[2] * speed))
                break;
            case 's':
                this.transform.translate(vec3.create(-forward[0] * speed, 0, -forward[2] * speed))
                break;
            case 'd':
                this.transform.translate(vec3.create(right[0] * speed, 0, right[2] * speed))
                break;
            case ' ': // space
                this.transform.translate(vec3.create(0, speed, 0))
                break;
            case 'Control':
            case 'Shift':
                this.transform.translate(vec3.create(0, -speed, 0))
                break;
        }
    }
}
