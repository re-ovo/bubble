<template>
  <canvas ref="canvasRef" class="w-screen h-screen"/>
</template>

<script setup lang="ts">
import {onMounted, useTemplateRef} from "vue";
import {WebGPURenderer} from "@/bubble/core/renderer";
import {Object3D, Scene} from "@/bubble/core/object3d";
import {PerspectiveCamera} from "@/bubble/core/camera";
import {MeshRenderer} from "@/bubble/renderer/mesh_renderer";
import {BlendMode, Material} from "@/bubble/material/material";
import {usePane} from "@/hooks/usePane";

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

const pane = usePane({
  title: 'Settings',
})

onMounted(async () => {
  if (!canvasRef.value) return
  canvasRef.value.width = canvasRef.value.clientWidth
  canvasRef.value.height = canvasRef.value.clientHeight

  const renderer = new WebGPURenderer()
  await renderer.init(canvasRef.value)

  const scene = new Scene()

  const cubeMaterial = new Material(null)

  const glass = new Object3D('Glass')
  const meshRenderer = glass.addComponent(MeshRenderer)
  meshRenderer.material = new Material(null)
  meshRenderer.material.blendMode = BlendMode.Multiply

  scene.addObject(new Object3D('Cube'))
      .addComponent(MeshRenderer)
      .material = cubeMaterial

  scene.addObject(glass)
  scene.addObject(new Object3D('Cube22'))
      .addComponent(MeshRenderer)
      .material = cubeMaterial

  const camera = new PerspectiveCamera(
      75,
      canvasRef.value.width / canvasRef.value.height,
      0.1,
      1000,
  )
  renderer.render(scene, camera)
})
</script>
