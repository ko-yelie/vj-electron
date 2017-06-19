import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    displayingVideos: []
  },
  mutations: {
    UPDATE_DISPLAYING_VIDEOS (state, videos) {
      state.displayingVideos = videos
    }
  },
  actions: {
    updateDisplayingVideos ({ commit }, videos) {
      commit('UPDATE_DISPLAYING_VIDEOS', videos)
    }
  },
  strict: process.env.NODE_ENV !== 'production'
})
