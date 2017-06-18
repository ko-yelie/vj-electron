<template lang="pug">
iframe.visual-frame(width="1024", height="768", :src="'https://www.youtube.com/embed/' + items[activeId].id + '?showinfo=0&rel=0&controls=0&fs=0&iv_load_policy=3&loop=1&autoplay=1'", frameborder="0", allowfullscreen="")
</template>

<script>
export default {
  name: 'visual-page',
  data () {
    return {
      activeId: 0,
      items: [
        {
          id: 'AovB1kid35o',
          title: 'AOKI takamasa // rhythm variation 06'
        },
        {
          id: 'ZQ1zjPqJBPQ',
          title: 'Alva Noto + Opiate - Opto File 2 - 2001'
        }
      ]
    }
  }
}
</script>

<style>
body {
  margin: 0;
}

.visual-frame {
  object-fit: cover;
  width: 100vw;
  height: 100vh;
}
</style>
