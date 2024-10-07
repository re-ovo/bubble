import {Object3D} from "@/bubble/core/object3d";
import {expect, test, vi} from "vitest";
import {Component} from "@/bubble/core/core";

test('Object3D', () => {
    const object3d = new Object3D('object3d')

    expect(object3d.label).toBe('object3d')
})

test('Object3D.component', () => {
    const object3d = new Object3D('object3d')

    const fn1 = vi.fn()

    class TestComponent1 extends Component {
        update(deltaTime: number) {
            fn1(deltaTime)
        }
    }

    class TestComponent2 extends Component {
        update(deltaTime: number) {
        }
    }

    object3d.addComponent(TestComponent1)

    // check if the component is added
    expect(object3d.components.size).toBe(1)

    // check if the component1 is added
    expect(object3d.getComponent(TestComponent1)).not.toBeNull()
    expect(object3d.getComponent(TestComponent1)).toBeInstanceOf(TestComponent1)

    // check if the component2 is not added
    expect(object3d.getComponent(TestComponent2)).toBeNull()

    // check if the update method is called
    object3d.getComponent(TestComponent1)?.update(233)
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn1).toHaveBeenCalledWith(233)

    // test removeComponent
    object3d.removeComponent(TestComponent1)
    expect(object3d.components.size).toBe(0)
})
