import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

// from https://www.shadertoy.com/view/WX2XDm
// and https://www.shadertoy.com/view/w3BSWz

#define R        iResolution.xy 
#define H(v)     fract(1e4*sin(1e4*(i)))
#define hue(v)  ( .6 + .6 * cos( 6.3*(v)  + vec4(0,23,21,0)  ) )

float _D;

float push_hole(vec2 U)
{
    float D = .15,                                      // push distance
          n = 2.;                                       // slope after push: "back to normal" invdistance
    vec2 M = iMouse.xy;
    if (length(M)>10.) M/=R, D = M.y, n = 1./(.01+M.x); // mouse control

    _D = D /= length(U);                                // --- pull original parameterization falling in this pixel
    return D > 1. ? 0. : pow(1.-pow(D,n), 1./n);      // concentration
}    

void main() {
    vec2 u = gl_FragCoord.xy;
    vec4 O = vec4(0.0);
    vec2 V,P,
          U = (2.*u - R) / R.y;        
    float t = iTime/4., v, i, d=1.;

    for(i=0.0; i < 2e2; i++) {
        P = (vec2(cos(t+i*17.), sin(t*1.3-i*3.)) + vec2(sin(-t*1.5+i*13.),cos(t*2.1-i*7.)))/2. *R/R.y, // bubble coord
        V = U - P,                                              // local coords in bubble
        v = push_hole(V);                                       // repulsion coefficient
        d = min(d,abs(_D-1.)/min(1.,fwidth(_D)));               // contour
        
        if (v==0.0 && O == vec4(0.0)) O = vec4(vec3((i+1.)/1e2),1.);            // bubble color
        
        U = P + v*V;                                            // push parameterization around bubble
    }
    
    fragColor = O;
}`;

class PaintblobShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
    this.addUniform("iMouse", "vec2", [0, 0]);
  }
}

customElements.define("paintblob-shader", PaintblobShader);
