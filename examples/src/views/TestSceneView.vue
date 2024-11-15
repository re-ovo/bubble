<template>
  <canvas ref="canvasRef" class="w-screen h-screen"/>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, useTemplateRef} from "vue";
import {RenderEngine} from "../../../src/core/engine";
import {Camera, CameraComponent, PerspectiveCamera} from "../../../src/node/camera/camera";
import {lookupModels, usePane} from "../hooks/usePane";
import {ForwardPlusPipeline} from "../../../src/pipeline/forwardplus/forward_plus_pipeline";
import {FPSController} from "../../../src/helper/controller";
import {vec3} from "wgpu-matrix";
import {Entity, Scene} from "../../../src/core/entity";
import {Transform} from "../../../src/core/transform";

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
  const sceneFolder = pane.addFolder({
    title: 'Scene',
  })
  lookupModels(sceneFolder, scene) // 列出所有模型

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
  const cameraEntity = scene.addChild(new Entity('Camera'))
  cameraEntity.addComponent(CameraComponent).camera = camera
  cameraEntity.transform.localPosition = vec3.fromValues(0, 5, 5)
  cameraEntity.addComponent(FPSController).init(canvasRef.value)
  const cameraFolder = pane.addFolder({
    title: 'Camera',
  })
  const cameraInfo = {
    get position() {
      return `[${cameraEntity.transform.localPosition[0].toFixed(2)}, ${cameraEntity.transform.localPosition[1].toFixed(2)}, ${cameraEntity.transform.localPosition[2].toFixed(2)}]`
    },
  }
  cameraFolder.addBinding(cameraInfo, 'position', {
    readonly: true,
    label: 'Camera Position',
  })
  cameraFolder.addBinding(cameraEntity.getComponent(FPSController)!, 'moveSpeed', {
    min: 0.1,
    max: 10,
    step: 0.1,
  })


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
