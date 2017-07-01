<template lang="pug">
canvas
</template>

<script>
import brick from './infiniteTubes/brick'

const demos = {
  brick
}

function mounted () {
  const canvas = this.$el

  demos[this.visual.demo](canvas)
}

export default {
  props: ['visual'],
  mounted
}
</script>
