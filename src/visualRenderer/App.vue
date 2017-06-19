<script>
import { mapState } from 'vuex'

export default {
  name: 'visual-page',
  computed: mapState([
    'displayingVideos'
  ])
}
</script>
<template lang="pug" src="./App.pug"></template>
<style lang="scss" src="./App.scss"></style>
