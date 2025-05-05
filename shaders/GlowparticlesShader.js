import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

void main() {
    vec2 I = gl_FragCoord.xy;
    vec4 O = vec4(0.0);
    
    for(vec2 i=vec2(0,-100),r=iResolution.xy; i.x<1e2;){
        O += (cos(i.x*i.x/3e2+vec4(4,2,0,0))+1.)/
        length(I+I-r-r*sin(iTime*cos(++i)))*
        r.y*(.4+.6*sin(i.x/30.0))/1e2;  // Replaced texture with sin function
    }
    fragColor = O;
}`;

class GlowparticlesShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("glowparticles-shader", GlowparticlesShader);
