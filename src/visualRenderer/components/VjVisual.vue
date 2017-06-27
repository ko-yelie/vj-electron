<template lang="pug">
component.visual(
  :is="visual.type"
  :visual="visual"
  :order="order"
)
</template>

<script>
import VjIframe from './VjIframe'
import VjVideo from './VjVideo'
import VjParticlesJs from './VjParticlesJs'

export default {
  props: ['visual', 'order'],
  components: {
    iframe: VjIframe,
    videoTag: VjVideo,
    particlesJs: VjParticlesJs
  }
}
</script>

<style lang="scss">
.visual {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
