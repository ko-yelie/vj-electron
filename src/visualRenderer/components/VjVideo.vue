<template lang="pug">
iframe.visual(
  :src="'https://www.youtube.com/embed/' + video.videoId + '?showinfo=0&rel=0&controls=0&fs=0&iv_load_policy=3&loop=1&autoplay=1'",
  frameborder="0",
  allowfullscreen=""
  :style="{ 'z-index': video.order, opacity: video.opacity }"
)
</template>

<script>
export default {
  props: ['video']
}
</script>

<style scoped lang="scss">
.visual {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
