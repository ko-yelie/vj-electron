<script>
import { mapState } from 'vuex'
import draggable from 'vuedraggable'
import RangeSlider from 'vue-range-slider'

export default {
  name: 'landing-page',
  data () {
    return {
      sliderValue: 50
    }
  },
  components: {
    draggable,
    RangeSlider
  },
  computed: {
    ...mapState({
    }),
    videos: {
      get () {
        return this.$store.state.Video.videos
      },
      set (value) {
        this.$store.dispatch('updateVideos', value)
      }
    },
    displayingVideos: {
      get () {
        return this.$store.state.Video.displayingVideos
      },
      set (value) {
        this.$store.dispatch('updateDisplayingVideos', value)
      }
    }
  },
  methods: {
  }
}
</script>
<template lang="pug" src="./LandingPage.pug"></template>
<style lang="scss" src="./LandingPage.scss"></style>
