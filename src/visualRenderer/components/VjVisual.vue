<template lang="pug">
component.visual(
  :is="visual.type"
  :visual="visual"
  :class="{ 'visual-copyright': visual.copyright }"
  :style="{ 'z-index': order, opacity: visual.opacity }"
)
</template>

<script>
import VjIframe from './VjIframe'
import VjVideo from './VjVideo'
import VjParticlesJs from './VjParticlesJs'
import VjInfiniteTubes from './VjInfiniteTubes'
import VjDynamicText from './VjDynamicText'

export default {
  props: ['visual', 'order'],
  components: {
    iframe: VjIframe,
    videoTag: VjVideo,
    particlesJs: VjParticlesJs,
    infiniteTubes: VjInfiniteTubes,
    dynamicText: VjDynamicText
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

  &-copyright {
    object-fit: contain;
    transform: scale(1.08);
  }
}
</style>
