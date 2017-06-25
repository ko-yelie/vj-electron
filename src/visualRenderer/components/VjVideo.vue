<template lang="pug">
video.visual(
  :src="visual.url"
  autoplay=""
  loop=""
  muted=""
  :style="{ 'z-index': order, opacity: visual.opacity }"
)
</template>

<script>
export default {
  props: ['visual', 'order']
}
</script>

<style scoped lang="scss">
</style>
