<template lang="pug">
canvas
</template>

<script>
import brick from './infiniteTubes/brick'
import particles from './infiniteTubes/particles'

const demos = {
  brick,
  particles
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
