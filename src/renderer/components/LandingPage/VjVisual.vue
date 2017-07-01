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

import particlesJsGui from '../gui/particlesJsGui.js'

const loadGUI = {
  particlesJsGui
}

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
  },
  mounted () {
    this.video.gui && loadGUI[this.video.gui](this.video.config)
  }
}
</script>

<style lang="scss">
$rail-fill-color: #3f51b5;

@import '~vue-range-slider/dist/vue-range-slider.scss';

.md-card {
  width: 300px;

  &-media {
    background: #000;
  }
}
</style>
