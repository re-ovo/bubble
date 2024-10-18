import {describe, expect, it, vi} from "vitest";
import {Component, Entity, Scene, Transform} from "@/bubble/core/system";

describe("Component and ComponentHolder", () => {
    const object3d = new Entity('object3d')
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    class TestComponent1 extends Component {
        update(deltaTime: number) {
            fn1(deltaTime)
        }
    }
    class TestComponent2 extends Component {
        update(deltaTime: number) {}
    }

    it('test component add', () => {
        object3d.addComponent(TestComponent1)

        // check if the component is added
        expect(object3d.components.size).toBe(2) // TransformComponent is added by default

        // check if the component1 is added
        expect(object3d.getComponent(TestComponent1)).not.toBeNull()
        expect(object3d.getComponent(TestComponent1)).toBeInstanceOf(TestComponent1)

        // check if the component2 is not added
        expect(object3d.getComponent(TestComponent2)).toBeNull()
    })

    it('test component get', () => {
        // check if the update method is called
        object3d.getComponent(TestComponent1)?.update(233)
        expect(fn1).toHaveBeenCalledTimes(1)
        expect(fn1).toHaveBeenCalledWith(233)
        expect(fn2).not.toHaveBeenCalled()
    })

    it('test component remove', () => {
        // test removeComponent
        object3d.removeComponent(TestComponent1)
        expect(object3d.getComponent(TestComponent1)).toBeNull()
    })

    it('test component tree', () => {
        let scene = new Scene()

        let object3d1 = new Entity('object3d1')
        let object3d2 = new Entity('object3d2')
        let object3d3 = new Entity('object3d3')

        scene.addEntity(object3d1)
        scene.addEntity(object3d2).setParent(object3d1)
        scene.addEntity(object3d3).setParent(object3d2)

        // check if the getChildren method works
        expect(scene.objects.length).toBe(3)

        expect(object3d1.getChildren(false)).toEqual([object3d2])
        expect(object3d1.getChildren(true)).toEqual([object3d2, object3d3])
        expect(object3d2.getChildren(false)).toEqual([object3d3])
        expect(object3d2.getChildren(true)).toEqual([object3d3])
        expect(object3d3.getChildren(false)).toEqual([])
        expect(object3d3.getChildren(true)).toEqual([])

        expect(object3d1.getComponent(Transform)!.scene).toBe(scene)
        expect(object3d2.getComponent(Transform)!.scene).toBe(scene)
        expect(object3d3.getComponent(Transform)!.scene).toBe(scene)

        expect(object3d1.getComponent(Transform)!.entity).toBe(object3d1)
        expect(object3d2.getComponent(Transform)!.entity).toBe(object3d2)
        expect(object3d3.getComponent(Transform)!.entity).toBe(object3d3)

        scene.removeEntity(object3d1)
        scene.removeEntity(object3d2)
        scene.removeEntity(object3d3)
        expect(scene.objects.length).toBe(0)
        expect(object3d1.getComponent(Transform)!.parentTransform).toBeNull()
        expect(object3d2.getComponent(Transform)!.parentTransform).toBeNull()
        expect(object3d3.getComponent(Transform)!.parentTransform).toBeNull()
    })

    it('test recursive parent', () => {
        let object1 = new Entity('object1')
        let object2 = new Entity('object2')
        let object3 = new Entity('object3')

        object1.setParent(object2)
        object2.setParent(object3)

        expect(object1.parent).toBe(object2)
        expect(object2.parent).toBe(object3)

        expect(() => object3.setParent(object1)).toThrowError('Cannot set parent: would create a circular dependency.')
    })
})

