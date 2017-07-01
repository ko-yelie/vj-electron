import { ipcRenderer } from 'electron'
import { uniqueId } from 'lodash'

import iframeData from '../../assets/json/visual/iframe.json'
import videoData from '../../assets/json/visual/video.json'
import jsData from '../../assets/json/visual/js.json'

const videos = iframeData.map(({ url, title, thumbnail }) => ({
  url,
  title,
  thumbnail,
  type: 'iframe',
  opacity: 1
})).concat(videoData.map(({ url, title, thumbnail }) => ({
  url,
  title,
  thumbnail,
  type: 'videoTag',
  opacity: 1
}))).concat(jsData.map(({ url, title, thumbnail, type, gui, config }) => ({
  url,
  title,
  thumbnail,
  type,
  gui,
  config,
  opacity: 1
})))

function dispatchToVisual (typeName, ...payload) {
  ipcRenderer.send('dispatch-connect', typeName, ...payload)
}

export default {
  state: {
    videos,
    displayingVideos: []
  },
  mutations: {
    UPDATE_VIDEOS (state, videos) {
      state.videos = videos
    },
    UPDATE_DISPLAYING_VIDEOS (state, displayingVideos) {
      state.displayingVideos = displayingVideos
    },
    ADD_DISPLAYING_VIDEO (state, { video, copyVideo }) {
      state.displayingVideos.splice(state.displayingVideos.indexOf(video), 1, copyVideo)
    },
    UPDATE_OPACITY (state, { video, opacity }) {
      video.opacity = opacity
    },
    REMOVE_DISPLAYING_VIDEO (state, video) {
      state.displayingVideos.splice(state.displayingVideos.indexOf(video), 1)
    }
  },
  actions: {
    updateVideos ({ commit }, videos) {
      commit('UPDATE_VIDEOS', videos)
    },
    updateDisplayingVideos ({ commit, state }, displayingVideos) {
      commit('UPDATE_DISPLAYING_VIDEOS', displayingVideos)
    },
    changeDisplayingVideos ({ commit, dispatch }, { added, moved }) {
      if (added) {
        dispatch('addDisplayingVideo', added.element)
      } else if (moved) {
        dispatch('updateDisplayingVideosOrder')
      }
    },
    addDisplayingVideo ({ commit, dispatch }, video) {
      const id = uniqueId()
      const copyVideo = Object.assign({ id }, video)
      commit('ADD_DISPLAYING_VIDEO', { video, copyVideo })

      dispatchToVisual('addDisplayingVideo', copyVideo)
      dispatch('updateDisplayingVideosOrder')
    },
    updateDisplayingVideosOrder ({ commit, state }) {
      dispatchToVisual('updateDisplayingVideosOrder', state.displayingVideos)
    },
    updateOpacity ({ commit }, payload) {
      commit('UPDATE_OPACITY', payload)

      dispatchToVisual('updateOpacity', payload.video)
    },
    removeDisplayingVideo ({ commit }, video) {
      commit('REMOVE_DISPLAYING_VIDEO', video)

      dispatchToVisual('removeDisplayingVideo', video)
    }
  }
}
