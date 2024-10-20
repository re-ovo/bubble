<template>
  <canvas ref="canvasRef" class="w-screen h-screen"/>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, useTemplateRef} from "vue";
import {RenderEngine} from "@/bubble/core/engine";
import {CameraComponent, PerspectiveCamera} from "@/bubble/node/camera/camera";
import {MeshRendererComponent} from "@/bubble/node/renderer/mesh_renderer";
import {usePane} from "@/hooks/usePane";
import {Entity, Scene, Transform} from "@/bubble/core/system";
import {ForwardPlusPipeline} from "@/bubble/pipeline/forwardplus/forward_plus_pipeline";
import {StandardMaterial} from "@/bubble/node/material/standard_material";
import colors from "@/bubble/math/colors";
import {createCubeMesh, Mesh} from "@/bubble/node/mesh/mesh";
import {vec3} from "wgpu-matrix";
import {RotateSelf} from "@/bubble/node/logic/RotateSelf";
import {loadGltfExample} from "@/bubble/loader/gltf_loader";

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

const pane = usePane({
  title: 'Settings',
})

let renderer: RenderEngine | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
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
    // 适配器选项
    adapterOptions: {
      powerPreference: 'high-performance',
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
      1000,
  )
  const cameraEntity = scene.addEntity(new Entity('Camera'))
  cameraEntity.addComponent(CameraComponent).camera = camera
  const cameraTransform = cameraEntity.getComponent(Transform)!
  cameraTransform.translate(vec3.fromValues(0, 0, 3))

  // GLTF
  loadGltfExample('Sponza').then((gltf) => {
    gltf.forEach((entity) => {
      scene?.addEntity(entity)
    })
  })

  // render loop
  const render = () => {
    if (rendering) {
      renderer?.render(scene!, camera!)
    }
    requestAnimationFrame(render)
  }

  render()

  const positionProxy = {
    get x() {
      return cameraTransform.position[0]
    },
    set x(value: number) {
      cameraTransform.setNeedsUpdate()
      cameraTransform.position[0] = value
    },
  }
  pane.addBinding(positionProxy, 'x', {
    min: -10,
    max: 10,
  })

  let materialPanel = pane.addFolder({
    title: 'Material',
  })
  const proxiedMaterialColor = {
    get color(): number {
      return colors.color4fToHex(material.color)
    },
    set color(value: number) {
      material.color = colors.newColor4fFromHex(value)
    },
  }
  materialPanel.addBinding(proxiedMaterialColor, 'color', {
    view: 'color'
  })
  materialPanel.addBinding(material, 'roughness', {
    min: 0,
    max: 1,
  })
  materialPanel.addBinding(material, 'metallic', {
    min: 0,
    max: 1,
  })

  pane.addButton({
    title: 'Pause/Play',
  }).on('click', () => {
    rendering = !rendering
  })
})

onUnmounted(() => {
  renderer?.destroy()
  console.log('destroyed renderer')
})
</script>
