<template lang="pug">
md-card
  md-card-media-cover(md-text-scrim='')
    md-card-media(md-ratio='16:9')
      img(:src="video.thumbnail", alt="")
    md-card-area
      md-card-header
        .md-title {{ video.title }}
      md-card-actions
        range-slider(
          min="0"
          max="1"
          step="0.05"
          v-model="opacity"
          @input="updateOpacity"
        )
        md-button(@click.native="removeDisplayingVideo") Remove
</template>

<script>
import RangeSlider from 'vue-range-slider'

export default {
  props: ['video'],
  data () {
    return {
      opacity: this.video.opacity
    }
  },
  components: {
    RangeSlider
  },
  methods: {
    updateOpacity (opacity) {
      this.$store.dispatch('updateOpacity', {
        video: this.video,
        opacity
      })
    },
    removeDisplayingVideo () {
      this.$store.dispatch('removeDisplayingVideo', this.video)
    }
  }
}
</script>

<style scoped lang="scss">
</style>
