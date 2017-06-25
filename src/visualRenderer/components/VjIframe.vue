<template lang="pug">
iframe.visual(
  :src="visual.url",
  frameborder="0",
  allowfullscreen=""
  :style="{ 'z-index': order, opacity: visual.opacity }"
)
</template>

<script>
export default {
  props: ['visual', 'order']
}
</script>

<style scoped lang="scss">
.visual {
  left: 50%;
  width: calc(100vh * #{(640 / 360)});
  transform: translateX(-50%);
}
</style>
