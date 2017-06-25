<template lang="pug">
component(
  :is="visual.type"
  :visual="visual"
  :order="order"
)
</template>

<script>
import VjIframe from './VjIframe'
import VjVideo from './VjVideo'

export default {
  props: ['visual', 'order'],
  components: {
    iframe: VjIframe,
    videoTag: VjVideo
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
