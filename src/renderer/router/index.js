import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage')
    },
    {
      path: '/control',
      name: 'control-page',
      component: require('@/components/ControlPage')
    },
    {
      path: '/visual',
      name: 'visual-page',
      component: require('@/components/VisualPage')
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
