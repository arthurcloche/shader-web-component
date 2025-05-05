import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

void main() {
    vec2 U = gl_FragCoord.xy;
    float t = iTime/10.;
    U = 8.* U / iResolution.xy - 4.;
    vec4 O = vec4(0.0);
    
    for (int i=0; i<4; i++) {
    	U += cos(U.yx *3. + vec2(t,1.6)) / 3.;
        U += sin(U.yx + t + vec2(1.6,0)) / 2.;
        U *= 1.3;
    }
    
	//O += length(mod(U,2.)-1.);  // black & white
	O.xy += abs(mod(U,2.)-1.); // color
    O.z = 0.5; // Add some blue
    O.w = 1.0; // Set alpha
    
    fragColor = O;
}`;

class RipplesShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("ripples-shader", RipplesShader);
