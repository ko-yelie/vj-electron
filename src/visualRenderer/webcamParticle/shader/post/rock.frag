precision mediump float;
uniform sampler2D texture;
uniform float     time;
uniform vec2      resolution;
uniform float     volume;
varying vec2      vUv;

#pragma glslify: random = require(glsl-random)

const float PI = 3.1415926;
const float PI2 = PI * 2.0;
const float interval = 10.;
const float rgbDiff = 0.1;
const float interval2 = 1.;

vec3 hsv(float h, float s, float v) {
  vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
  return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}

void main(){
  vec4 video = texture2D(texture, vUv);

  float rnd = random(vec2(time));
  float nTime = mod(time, interval) / interval;
  float strength = sin(nTime * PI2);
  float cRgbDiff = rgbDiff * (strength + rnd * 0.01);
  float r = texture2D(texture, vec2(vUv.x + cRgbDiff, vUv.y)).r;
  float g = texture2D(texture, vec2(vUv.x, vUv.y)).g;
  float b = texture2D(texture, vec2(vUv.x - cRgbDiff, vUv.y)).b;
  vec4 color = vec4(r, g, b, 1.0);

  nTime = mod(time, interval2) / interval2;
  vec2 uv = (vUv - 0.5) / mix(0.8, 1.4, nTime) + 0.5;
  vec4 color2 = texture2D(texture, uv);
  vec4 mono = vec4(vec3(step(0.15, (color2.r + color2.g + color2.b) / 3.)), 1.);
  // color2 = vec4(vec3(color2.r, 0., 0.), 0.5);
  color2 = mono * vec4(hsv(abs(sin(nTime * 0.1 * PI)), 1., 1.), 1.);

  gl_FragColor = video + color * color2;
  // gl_FragColor = color2;
}
