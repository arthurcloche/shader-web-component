import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    float speed = .1;
    float scale = 0.002;
    vec2 p = fragCoord * scale;   
    
    for(int i=1; i<10; i++) {
        p.x+=0.3/float(i)*sin(float(i)*3.*p.y+iTime*speed)+iMouse.x/1000.;
        p.y+=0.3/float(i)*cos(float(i)*3.*p.x+iTime*speed)+iMouse.y/1000.;
    }
    
    float r=cos(p.x+p.y+1.)*.5+.5;
    float g=sin(p.x+p.y+1.)*.5+.5;
    float b=(sin(p.x+p.y)+cos(p.x+p.y))*.3+.5;
    vec3 color = vec3(r,g,b);
    
    fragColor = vec4(color,1);
}`;

class WatercolorShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("watercolor-shader", WatercolorShader);
