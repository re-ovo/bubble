<template>
  <canvas ref="canvasRef" class="w-screen h-screen"/>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, useTemplateRef} from "vue";
import {WebGPURenderer} from "@/bubble/core/renderer";
import {Object3D} from "@/bubble/core/object3d";
import {PerspectiveCamera} from "@/bubble/core/camera";
import {MeshRenderer} from "@/bubble/node/renderer/mesh_renderer";
import {BlendMode, Material} from "@/bubble/node/material/material";
import {usePane} from "@/hooks/usePane";
import {Scene} from "@/bubble/core/scene";

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
  await renderer.init(canvasRef.value)

  scene = new Scene()

  const cubeMaterial = new Material(null)
  const glass = new Object3D('Glass')
  const meshRenderer = glass.addComponent(MeshRenderer)
  meshRenderer.material = new Material(null)
  meshRenderer.material.blendMode = BlendMode.Multiply

  scene.addObject(new Object3D('Cube'))
      .addComponent(MeshRenderer)
      .material = cubeMaterial

  camera = new PerspectiveCamera(
      75,
      canvasRef.value.width / canvasRef.value.height,
      0.1,
      1000,
  )

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
