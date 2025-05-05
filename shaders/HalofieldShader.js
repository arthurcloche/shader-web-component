import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord / iResolution.y, s = vec2(.0), c = vec2(.0);
    vec3 pixel = vec3(0.);
    float t = iTime * 0.07, d = 0.0, r = 0.0;
    
    for(float i=0.0; i<50.0; i+=1.0) {
       s = vec2(t + fract(sin(i*0.9)*37.0), t + fract(cos(i*2.5)*37.0));
       c.x = fract(cos(i*42.9 + s.x)*2.551) * 4.0 - 1.0;
       c.y = fract(sin(i*13.44 + s.y)*0.987) * 3.0 - 1.0;
       r = fract(sin((i*0.6))*5.0) * 0.67;
       d = length(uv - c);
       pixel[int(mod(i,3.0))] += smoothstep(d*0.05,d,r*r)*0.47;
    }
    
    fragColor = vec4(pixel, 1.0);
}`;

class HalofieldShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("halofield-shader", HalofieldShader);
