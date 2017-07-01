<template lang="pug">
video(
  :src="visual.url"
  autoplay=""
  loop=""
  muted=""
)
</template>

<script>
export default {
  props: ['visual']
}
</script>
