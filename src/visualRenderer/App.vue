<script>
import { mapState } from 'vuex'

export default {
  name: 'visual-page',
  computed: mapState([
    'videoStack'
  ]),
  methods: {
    changeActiveId (video) {
      this.$store.dispatch('changeActiveId', video)
    }
  }
}
</script>
<template lang="pug" src="./App.pug"></template>
<style lang="scss" src="./App.scss"></style>
