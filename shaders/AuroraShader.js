import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

void main() {
    vec2 u = gl_FragCoord.xy / iResolution.xy;
    vec4 f;
    f.xy = .5 - u;

    float t = iTime,
          z = atan(f.y, f.x) * 3.,
          v = cos(z + sin(t * .1)) + .5 + sin(u.x * 10. + t * 1.3) * .4;

    f.x = 1.2 + cos(z - t*.2) + sin(u.y*10.+t*1.5)*.5;
    f.yz = vec2(sin(v*4.)*.25, sin(v*2.)*.3) + f.x*.5;
    f.w = 1.0;
    
    fragColor = f;
}`;

class AuroraShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("aurora-shader", AuroraShader);
