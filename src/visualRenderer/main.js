import { ipcRenderer } from 'electron'
import Vue from 'vue'

import App from './App'
import store from './store'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

ipcRenderer.on('dispatch-connect', (event, typeName, ...payload) => {
  store.dispatch(typeName, ...payload)
})

/* eslint-disable no-new */
new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
