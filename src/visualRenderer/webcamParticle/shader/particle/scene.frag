precision highp float;
uniform sampler2D videoTexture;
uniform float     bgColor;
uniform float     mode;
uniform float     pointShape;
uniform float     animation;
varying vec2 vTexCoord;
varying vec4 vPosition;

float lengthN(vec2 v, float n) {
  vec2 tmp = pow(abs(v), vec2(n));
  return pow(tmp.x + tmp.y, 1. / n);
}

void main(){
  vec4 video = texture2D(videoTexture, vTexCoord);
  float rate = vPosition.z / vPosition.w;

  vec2 pointCoord = gl_PointCoord.st * 2. - 1.;
  float circle = smoothstep(0.9, 1., length(pointCoord));
  float star = smoothstep(0.9, 1., lengthN(pointCoord, 0.5));
  float shape = mix(1., 1. - mix(circle, star, step(2., pointShape)), pointShape);
  vec4 shapeColor = vec4(vec3(1.), mix(1., shape, step(mode, 0.)));
  vec4 thumbColor = texture2D(videoTexture, vec2(gl_PointCoord.s, 1. - gl_PointCoord.t));
  vec4 particleColor = mix(shapeColor, thumbColor, step(3., pointShape));

  float minCurrentColor = mix(mix(0.2, 0.3, animation), 0.4, bgColor);
  float maxCurrentColor = mix(0.95, 0.95, bgColor);
  vec4 currentColor = mix(vec4(minCurrentColor), vec4(maxCurrentColor), video);

  gl_FragColor = vec4(currentColor.rgb, sqrt(rate)) * particleColor;
}
