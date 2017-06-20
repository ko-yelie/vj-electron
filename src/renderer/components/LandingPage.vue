<script>
import { mapState } from 'vuex'
import draggable from 'vuedraggable'

import VjVideo from './LandingPage/VjVideo'

export default {
  name: 'landing-page',
  data () {
    return {
      sliderValue: 50
    }
  },
  components: {
    draggable,
    VjVideo
  },
  computed: {
    ...mapState({
    }),
    videos: {
      get () {
        return this.$store.state.Video.videos
      },
      set (videos) {
        this.$store.dispatch('updateVideos', videos)
      }
    },
    displayingVideos: {
      get () {
        return this.$store.state.Video.displayingVideos
      },
      set (displayingVideos) {
        this.$store.dispatch('updateDisplayingVideos', displayingVideos)
      }
    }
  },
  methods: {
  }
}
</script>
<template lang="pug" src="./LandingPage.pug"></template>
<style lang="scss" src="./LandingPage.scss"></style>
