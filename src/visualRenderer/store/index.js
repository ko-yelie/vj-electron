import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    videoStack: []
  },
  mutations: {
    CHANGE_ACTIVE_ID (state, video) {
      state.videoStack.push(video)
    }
  },
  actions: {
    changeActiveId ({ commit }, video) {
      commit('CHANGE_ACTIVE_ID', video)
    }
  },
  strict: process.env.NODE_ENV !== 'production'
})
