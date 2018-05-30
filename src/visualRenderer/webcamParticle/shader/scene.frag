precision mediump float;
uniform sampler2D particleTexture;
uniform sampler2D postTexture;
uniform float videoAlpha;
uniform float particleAlpha;
varying vec2 vUv;

void main(){
  vec4 post = texture2D(postTexture, vUv);
  vec4 particle = texture2D(particleTexture, vUv);

  float isParticle = (1. - step(particle.w, 0.));

  gl_FragColor = post * videoAlpha * (1. - particle.w) + particle * particle.w * particleAlpha;
}
