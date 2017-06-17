<template>
  <div id="app" class="wrapper">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'electron-vue'
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body { font-family: 'Source Sans Pro', sans-serif; }

.wrapper {
  background:
    radial-gradient(
      ellipse at top left,
      rgba(255, 255, 255, 1) 40%,
      rgba(229, 229, 229, .9) 100%
    );
  height: 100vh;
  padding: 20px 40px;
  width: 100vw;
}
</style>
