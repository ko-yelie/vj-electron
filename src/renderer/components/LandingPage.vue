<script>
import { mapState } from 'vuex'
import RangeSlider from 'vue-range-slider'

export default {
  name: 'landing-page',
  data () {
    return {
      sliderValue: 50
    }
  },
  components: {
    RangeSlider
  },
  computed: mapState({
    videos: state => state.Video.videos,
    activeId: state => state.Video.activeId
  }),
  methods: {
    getVideoClass (video) {
      return {
        'md-active': video.id === this.activeId
      }
    },
    changeActiveId (video) {
      this.$store.dispatch('changeActiveId', video)
    }
  }
}
</script>
<template lang="pug" src="./LandingPage.pug"></template>
<style lang="scss" src="./LandingPage.scss"></style>
