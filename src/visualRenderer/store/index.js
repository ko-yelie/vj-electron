import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    displayingVideos: []
  },
  mutations: {
    ADD_DISPLAYING_VIDEO () {},
    UPDATE_DISPLAYING_VIDEOS_ORDER () {},
    UPDATE_OPACITY () {},
    REMOVE_DISPLAYING_VIDEO () {}
  },
  actions: {
    addDisplayingVideo ({ commit }, addedVideo) {
      commit('ADD_DISPLAYING_VIDEO', addedVideo)
    },
    updateDisplayingVideosOrder ({ commit }, displayingVideos) {
      commit('UPDATE_DISPLAYING_VIDEOS_ORDER', displayingVideos)
    },
    updateOpacity ({ commit }, video) {
      commit('UPDATE_OPACITY', video)
    },
    removeDisplayingVideo ({ commit }, video) {
      commit('REMOVE_DISPLAYING_VIDEO', video)
    }
  },
  strict: process.env.NODE_ENV !== 'production'
})
