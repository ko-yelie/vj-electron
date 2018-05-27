precision mediump float;
uniform sampler2D particleTexture;
uniform sampler2D postTexture;
varying vec2      vUv;

void main(){
  vec4 post = texture2D(postTexture, vUv);
  vec4 particle = texture2D(particleTexture, vUv);
  float isParticle = (1. - step(particle.w, 0.));

  gl_FragColor = vec4(post.rgb + (particle.rgb * isParticle), 1.);
}
