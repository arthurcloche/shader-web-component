import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

vec2 hex2(vec2 p){
    vec2 o = fract(p *= mat2(10, 5.8, 0, 11.5) / iResolution.y);
    p -= o;
    float alpha = mod(p.x+p.y,3.);
    return ((alpha) < 2. ? p + alpha : p + step(o.yx,o.xy)).xy / 14.;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    //Scaled pixel coordinates
    vec2 p = fragCoord.xy/iResolution.y*6.;
    vec2 hex = hex2(fragCoord)*2.-1.;
    
    //8 wave passes
    for(float i=0.0; i<8.0; i++) {
        //Add a simple sine wave with an offset and animation
        p.x += sin(p.y+i+iTime*.3);
        p += hex *0.5 * i;
        //Rotate and scale down
        p *= mat2(6,-8,8,6)/8.;
    }
    
    //Pick a color using the turbulent coordinates
    fragColor = sin(p.xyxy*.3+vec4(0,1,2,3))*.5+.5;
}`;

class TurbulencehexShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
    this.addUniform("iMouse", "vec2", [0, 0]);
  }
}

customElements.define("turbulencehex-shader", TurbulencehexShader);
