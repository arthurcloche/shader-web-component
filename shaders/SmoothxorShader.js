import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = 256.0 * fragCoord.xy/iResolution.x + iTime;
    float an = smoothstep( -0.5, 0.5, cos(3.14159*iTime) );
    float x = 0.0;
    for( int i=0; i<7; i++ ) {
        vec2 a = floor(p);
        vec2 b = fract(p);
        x += mod( a.x + a.y, 2.0 ) * mix( 1.0, 1.5*pow(4.0*(1.0-b.x)*b.x*(1.0-b.y)*b.y,0.25), an );
        p /= 2.0;
        x /= 2.0;
    }
    fragColor = vec4( x, x, x, 1.0 );
}`;

class SmoothxorShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}
customElements.define("smoothxor-shader", SmoothxorShader);
