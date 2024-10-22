<template>
  <canvas ref="canvasRef" class="w-screen h-screen"/>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, useTemplateRef} from "vue";
import {RenderEngine} from "@/bubble/core/engine";
import {Camera, CameraComponent, PerspectiveCamera} from "@/bubble/node/camera/camera";
import {usePane} from "@/hooks/usePane";
import {Entity, Scene, Transform} from "@/bubble/core/system";
import {ForwardPlusPipeline} from "@/bubble/pipeline/forwardplus/forward_plus_pipeline";
import {loadGltfModel} from "@/bubble/loader/gltf_loader";
import {FPSController} from "@/bubble/helper/controller";

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

const pane = usePane({
  title: 'Settings',
})

let renderer: RenderEngine | null = null
let scene: Scene | null = null
let camera: Camera | null = null
let rendering = true

onMounted(async () => {
  if (!canvasRef.value) return
  canvasRef.value.width = canvasRef.value.clientWidth
  canvasRef.value.height = canvasRef.value.clientHeight

  renderer = new RenderEngine()

  await renderer.init(canvasRef.value, {
    // 自定义渲染管线
    pipelineProvider() {
      return new ForwardPlusPipeline()
    },
  })

  // setup scene
  scene = new Scene()

  // let material = new StandardMaterial()
  // material.color = colors.newColor4f(1, 0, 0, 1)
  // let cube = createCubeMesh()
  // const cubeEntity = scene.addEntity(new Entity('Cube'))
  // let meshRenderer = cubeEntity
  //     .addComponent(MeshRendererComponent)
  // meshRenderer.material = material
  // meshRenderer.mesh = cube
  // cubeEntity.addComponent(RotateSelf)


  // setup camera
  camera = new PerspectiveCamera(
      75,
      canvasRef.value.width / canvasRef.value.height,
      0.1,
      10000,
  )
  // camera = new OrthographicCamera(
  //   -1000,
  //   1000,
  //   -1000,
  //   1000,
  //   0.1,
  //   10000,
  // )
  const cameraEntity = scene.addEntity(new Entity('Camera'))
  cameraEntity.addComponent(CameraComponent).camera = camera
  const cameraTransform = cameraEntity.getComponent(Transform)!
  // cameraTransform.setPosition(vec3.fromValues(-481, 158, -56))
  cameraEntity.addComponent(FPSController).init(canvasRef.value)
  const cameraInfo = {
    get position() {
      return `[${cameraTransform.position[0].toFixed(2)}, ${cameraTransform.position[1].toFixed(2)}, ${cameraTransform.position[2].toFixed(2)}]`
    },
  }
  pane.addBinding(cameraInfo, 'position', {
    readonly: true,
    label: 'Camera Position',
  })
  pane.addBinding(cameraEntity.getComponent(FPSController)!, 'moveSpeed', {
    min: 0.1,
    max: 10,
    step: 0.1,
  })

  // GLTF
  // loadGltfExample('Sponza').then((gltf) => {
  //   gltf.forEach((entity) => {
  //     scene?.addEntity(entity)
  //   })
  // })
  loadGltfModel('/models/miyu.glb').then((gltf) => {
    gltf.forEach((entity) => {
      scene?.addEntity(entity)
    })
  })
  // loadGltfModel(
  //     '/models/Bistro/bistro.gltf',
  //     (e) => scene?.addEntity(e)
  // )

  // render loop
  const render = () => {
    if (rendering) {
      renderer!.render(scene!, camera!)
    }
    requestAnimationFrame(render)
  }

  render()

  // let materialPanel = pane.addFolder({
  //   title: 'Material',
  // })
  // const proxiedMaterialColor = {
  //   get color(): number {
  //     return colors.color4fToHex(material.color)
  //   },
  //   set color(value: number) {
  //     material.color = colors.newColor4fFromHex(value)
  //   },
  // }
  // materialPanel.addBinding(proxiedMaterialColor, 'color', {
  //   view: 'color'
  // })
  // materialPanel.addBinding(material, 'roughness', {
  //   min: 0,
  //   max: 1,
  // })
  // materialPanel.addBinding(material, 'metallic', {
  //   min: 0,
  //   max: 1,
  // })

  pane.addButton({
    title: 'Pause/Play',
  }).on('click', () => {
    rendering = !rendering
  })
})

window.addEventListener('resize', () => {
  if (!canvasRef.value) return
  canvasRef.value.width = canvasRef.value.clientWidth
  canvasRef.value.height = canvasRef.value.clientHeight
  renderer?.resize(canvasRef.value.width, canvasRef.value.height)
  if (camera) {
    if(camera instanceof PerspectiveCamera) camera.aspect = canvasRef.value.width / canvasRef.value.height
    camera.updateProjectionMatrix()
  }
})

onUnmounted(() => {
  renderer?.destroy()
  renderer = null
  console.log('destroyed renderer')
})
</script>
