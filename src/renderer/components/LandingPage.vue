<script>
import draggable from 'vuedraggable'

import VjVideo from './LandingPage/VjVideo'

let displayingVideosCache = []

export default {
  name: 'landing-page',
  components: {
    draggable,
    VjVideo
  },
  computed: {
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
        displayingVideosCache = displayingVideos
      }
    }
  },
  methods: {
    changeDisplayingVideos (evt) {
      this.$store.dispatch('updateDisplayingVideos', displayingVideosCache)
      this.$store.dispatch('changeDisplayingVideos', evt)
    }
  }
}
</script>
<template lang="pug" src="./LandingPage.pug"></template>
<style lang="scss" src="./LandingPage.scss"></style>
