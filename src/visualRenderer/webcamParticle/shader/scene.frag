precision mediump float;
uniform sampler2D particleTexture;
uniform sampler2D postTexture;
uniform float videoAlpha;
uniform float particleAlpha;
varying vec2 vUv;

void main(){
  vec4 post = texture2D(postTexture, vUv);
  vec4 particle = texture2D(particleTexture, vUv);

  gl_FragColor = post * videoAlpha * (1. - particle.w * particleAlpha) + particle * particle.w * particleAlpha;
}
