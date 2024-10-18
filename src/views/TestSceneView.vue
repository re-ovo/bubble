<template>
  <canvas ref="canvasRef" class="w-screen h-screen"/>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, useTemplateRef} from "vue";
import {RenderEngine} from "@/bubble/core/engine";
import {Entity} from "@/bubble/core/entity";
import {CameraComponent, PerspectiveCamera} from "@/bubble/node/camera/camera";
import {MeshRendererComponent} from "@/bubble/node/renderer/mesh_renderer";
import {Material} from "@/bubble/node/material/material";
import {usePane} from "@/hooks/usePane";
import {Scene} from "@/bubble/core/scene";
import {ForwardPlusPipeline} from "@/bubble/pipeline/forwardplus/forward_plus_pipeline";
import {Shader} from "@/bubble/shader/shader";
import mesh_shader from "@/bubble/shader/mesh/mesh_shader";

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

  scene.addEntity(new Entity('Cube'))
      .addComponent(MeshRendererComponent)
      .material = new Material(
      new Shader(mesh_shader),
  )

  // setup camera
  camera = new PerspectiveCamera(
      75,
      canvasRef.value.width / canvasRef.value.height,
      0.1,
      1000,
  )
  scene.addEntity(new Entity('Camera'))
      .addComponent(CameraComponent)
      .camera = camera

  // render loop
  const render = () => {
    if (rendering) renderer?.render(scene!, camera!)
    requestAnimationFrame(render)
  }

  render()

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
