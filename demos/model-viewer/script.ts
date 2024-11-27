import {createCubeMesh, Entity, MeshRendererComponent, RenderEngine, Scene, StandardMaterial} from "@bubblejs/bubble";
import {Pane} from "tweakpane";
import {lookupModels} from "../panel";
import {setupFpsCamera} from "../fps_camera_setup";

const canvasRef = document.querySelector('#canvas') as HTMLCanvasElement;
canvasRef.width = canvasRef.clientWidth;
canvasRef.height = canvasRef.clientHeight;

const engine = new RenderEngine();
await engine.init(canvasRef, {
    // pipelineProvider() {
    //     return new ForwardPlusPipeline()
    // },
});
const pane = new Pane();

let scene = new Scene()

lookupModels(pane, scene);

const {cameraEntity, cameraComponent} = setupFpsCamera(canvasRef, engine, pane);
scene.addChild(cameraEntity)

let cubeEntity = new Entity('Cube')
let mr = cubeEntity.addComponent(MeshRendererComponent)
mr.mesh = createCubeMesh()
mr.material = new StandardMaterial()

const draw = () => {
    engine.render(scene, cameraComponent.camera!)
    requestAnimationFrame(draw);
}

draw()
