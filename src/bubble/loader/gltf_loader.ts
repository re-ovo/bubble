import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import {load} from "@loaders.gl/core";
import {Entity} from "@/bubble/core/system";
import {MeshRendererComponent} from "@/bubble/node/renderer/mesh_renderer";
import {Mesh} from "@/bubble/node/mesh/mesh";
import {BufferAttribute} from "@/bubble/resource/primitive/attribute";
import {StandardMaterial} from "@/bubble/node/material/standard_material";
import colors from "@/bubble/math/colors";

export async function loadGltfModel(url: string) {
    const gltf = await load(url, GLTFLoader)
    const gltfPostProcessed = postProcessGLTF(gltf)
    console.log(gltfPostProcessed)
    return convertToEntities(gltfPostProcessed)
}

export async function loadGltfExample(modelName: string) {
    return await loadGltfModel(`https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/${modelName}/glTF/${modelName}.gltf`)
}

function convertToEntities(gltf: GLTFPostprocessed): Entity[] {
    const entities: Entity[] = []

    for(const mesh of gltf.meshes) {
        for(const primitive of mesh.primitives) {
            // console.log(primitive)
            const entity = new Entity()
            const renderer = entity.addComponent(MeshRendererComponent)

            const mesh = new Mesh()
            mesh.addAttribute('position', new BufferAttribute(
                primitive.attributes['POSITION'].value,
                3
            ))
            mesh.addAttribute('normal', new BufferAttribute(
                primitive.attributes['NORMAL'].value,
                3
            ))
            if(primitive.indices) {
                const uint16Array = new Uint16Array(primitive.indices.value)
                mesh.setIndices(uint16Array)
            }
            renderer.mesh = mesh

            const material = new StandardMaterial()
            material.color = colors.newColor4fFromHex('#00bb00')
            renderer.material = material

            entities.push(entity)
        }
    }

    return entities
}
