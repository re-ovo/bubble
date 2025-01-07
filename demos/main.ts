document.querySelector('#app')!.innerHTML = `
    <h1>Bubble Demos</h1>
    <ul>
      <li><a href="/demos/model-viewer/index.html">Model Viewer</a></li>
    </ul>
`;

import { ShaderManager } from '@/shader/shader_lib';
import standard from '@/shader/sources/mesh/standard.wgsl?raw';

try {
  console.log('test');
  const shaderManager = ShaderManager.getInstance();
  const code = shaderManager.process(standard, {});
  console.log(code);
} catch (e) {
  console.error(e);
}
