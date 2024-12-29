import { Texture } from "@/resource";

export type TextureId = number;
export type BufferId = number;

interface RGRenderPass {
    readonly name: string;
}

interface RGResources {

}

interface RGRenderPassBuilder {
    
}

interface RenderGraph {
    readonly resources: RGResources;
    readonly passes: RGRenderPass[];

    compile(): void;

    execute(): void;
} 