<template>
  <canvas ref="canvasRef" class="w-screen h-screen"/>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, useTemplateRef} from "vue";
import {WebGPURenderer} from "@/bubble/core/renderer";
import {Object3D} from "@/bubble/core/object3d";
import {CameraComponent, PerspectiveCamera} from "@/bubble/core/camera";
import {MeshRenderer} from "@/bubble/node/renderer/mesh_renderer";
import {BlendMode, Material} from "@/bubble/node/material/material";
import {usePane} from "@/hooks/usePane";
import {Scene} from "@/bubble/core/scene";
import {ForwardPlusPipeline} from "@/bubble/pipeline/forwardplus/forward_plus_pipeline";

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

const pane = usePane({
  title: 'Settings',
})

let renderer: WebGPURenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let rendering = true

onMounted(async () => {
  if (!canvasRef.value) return
  canvasRef.value.width = canvasRef.value.clientWidth
  canvasRef.value.height = canvasRef.value.clientHeight

  renderer = new WebGPURenderer()

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

  const cubeMaterial = new Material(null)
  const glass = new Object3D('Glass')
  const meshRenderer = glass.addComponent(MeshRenderer)
  meshRenderer.material = new Material(null)
  meshRenderer.material.blendMode = BlendMode.Multiply

  scene.addObject(new Object3D('Cube'))
      .addComponent(MeshRenderer)
      .material = cubeMaterial

  // setup camera
  camera = new PerspectiveCamera(
      75,
      canvasRef.value.width / canvasRef.value.height,
      0.1,
      1000,
  )
  scene.addObject(new Object3D('Camera'))
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
