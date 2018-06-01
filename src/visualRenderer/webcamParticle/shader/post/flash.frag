precision mediump float;
uniform sampler2D texture;
uniform float     time;
uniform vec2      resolution;
uniform float     volume;
uniform float     custom;
varying vec2      vUv;

#pragma glslify: random = require(glsl-random)
#pragma glslify: hsv = require(../modules/color.glsl)

const float PI = 3.1415926;
const float PI2 = PI * 2.0;

void main(){
  vec4 video = texture2D(texture, vUv);

  float rnd = random(vec2(time));
  float mixedRnd = mix(0.7, 1., rnd);

  vec3 rndColor = hsv(rnd * PI2, mixedRnd, mixedRnd);
  rndColor = mix(vec3(0.7), vec3(1.), rndColor);

  gl_FragColor = video * vec4(rndColor, mix(0.4, 1.2, rnd));
}
