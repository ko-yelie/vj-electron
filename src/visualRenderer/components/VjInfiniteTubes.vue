<template lang="pug">
canvas
</template>

<script>
import brick from './infiniteTubes/brick'
import particles from './infiniteTubes/particles'
import starWars from './infiniteTubes/starWars'

const demos = {
  brick,
  particles,
  starWars
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
