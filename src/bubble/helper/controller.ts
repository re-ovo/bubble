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
            this.onMouseMove(e)
            e.preventDefault()
        }
        const keydownHandler = (e: KeyboardEvent) => {
            this.onKeydown(e)
            e.preventDefault()
        }
        const keyupHandler = (e: KeyboardEvent) => {
            this.pressingKeys.delete(e.key)
            e.preventDefault()
        }
        const preventCloseWindow = (e: BeforeUnloadEvent) => {
            e.preventDefault()
        }
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement) {
                element.addEventListener('mousemove', moveHandler)
                document.addEventListener('keydown', keydownHandler)
                document.addEventListener('keyup', keyupHandler)
                window.addEventListener('beforeunload', preventCloseWindow)
            } else {
                element.removeEventListener('mousemove', moveHandler)
                document.removeEventListener('keydown', keydownHandler)
                document.removeEventListener('keyup', keyupHandler)
                window.removeEventListener('beforeunload', preventCloseWindow)
            }
        })
        document.addEventListener('pointerlockerror', () => {
            console.error('Pointer lock failed')
        })
    }

    onMouseMove(e: MouseEvent) {
        const sensitivity = 0.1;

        const yaw = e.movementX * sensitivity;
        const pitch = e.movementY * sensitivity;

        this.transform.rotateYawPitch(angleToRadians(-yaw), angleToRadians(-pitch))
    }

    onKeydown(e: KeyboardEvent) {
        this.pressingKeys.add(e.key)
    }

    update(deltaTime: number) {
        for (const key of this.pressingKeys) {
            this.handleKey(key)
        }
    }

    handleKey(key: string) {
        const forward = this.transform.forwardDirection
        const right = this.transform.rightDirection
        const speed = 0.1
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
            case 'Shift':
            case 'q':
                this.transform.translate(vec3.create(0, -speed, 0))
                break;
        }
    }
}
