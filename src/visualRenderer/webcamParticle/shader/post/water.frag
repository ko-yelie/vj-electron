precision mediump float;
uniform sampler2D texture;
uniform float     time;
uniform vec2      resolution;
uniform float     volume;
uniform float     custom;
varying vec2      vUv;

#pragma glslify: random = require(glsl-random)

const float MAX_ITER = 4.;
const float inten = 0.05;

void main(){
  vec2 p = vUv * 8. - vec2(20.);
  vec2 i;
  float t;
  vec2 bc;
  float c = 1.;

  vec2 uv = vUv;

  for (float n = 0.; n < MAX_ITER; n++) {
    t = time * (2. - (3. / (n + 1.)));

    i = p + vec2(
      cos(t - i.x) + sin(t + i.y),
      sin(t - i.y) + cos(t + i.x)
    );

    bc = vec2(
      (sin(i.x + t) / inten),
      (cos(i.y + t) / inten)
    );

    c += 1.0 / length(p / bc);

    uv += length(bc) * 0.0005;
  }

  c /= float(MAX_ITER);
  c = 1.5 - sqrt(c);

  vec4 texColor = vec4(vec3(0.5), 1.);

  texColor.rgb *= (1. / (1.05 - (c + 0.1)));

  vec4 video = texture2D(texture, uv * 0.95);

  gl_FragColor = video * texColor;
}
