import { ipcRenderer } from 'electron'
import { uniqueId } from 'lodash'

import videoData from '../../assets/json/visual/video.json'
import canvasData from '../../assets/json/visual/canvas.json'
import iframeData from '../../assets/json/visual/iframe.json'

const visualStock = {
  video: videoData.map(visualData => Object.assign(visualData, {
    type: 'videoTag',
    opacity: visualData.opacity || 1
  })),
  canvas: canvasData.map(visualData => Object.assign(visualData, {
    opacity: visualData.opacity || 1
  })),
  iframe: iframeData.map(visualData => Object.assign(visualData, {
    type: 'iframe',
    opacity: visualData.opacity || 1
  }))
}

function dispatchToVisual (typeName, ...payload) {
  ipcRenderer.send('dispatch-connect', typeName, ...payload)
}

export default {
  state: {
    visualStock,
    displayingVideos: []
  },
  mutations: {
    UPDATE_VIDEOS (state, visualStock) {
      state.visualStock = visualStock
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
    },
    refresh () {
      dispatchToVisual('refresh')
      location.reload()
    }
  }
}
