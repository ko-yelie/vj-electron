import { ipcRenderer } from 'electron'
import { uniqueId } from 'lodash'

const videoData = [
  {
    videoId: 'AovB1kid35o',
    title: 'AOKI takamasa // rhythm variation 06'
  },
  {
    videoId: 'ZQ1zjPqJBPQ',
    title: 'Alva Noto + Opiate - Opto File 2 - 2001'
  }
]
const videos = videoData.map(({ videoId, title }) => ({
  videoId,
  title,
  thumbnail: `./src/renderer/assets/${videoId}.jpg`,
  opacity: 1
}))

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
    UPDATE_DISPLAYING_VIDEOS_ORDER (state) {
      state.displayingVideos.map((video, index) => {
        video.order = index
      })
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
    addDisplayingVideo ({ commit, state }, video) {
      const id = uniqueId()
      const copyVideo = Object.assign({ id }, video)
      commit('ADD_DISPLAYING_VIDEO', { video, copyVideo })
      commit('UPDATE_DISPLAYING_VIDEOS_ORDER')

      dispatchToVisual('addDisplayingVideo', copyVideo)
      dispatchToVisual('updateDisplayingVideosOrder', state.displayingVideos)
    },
    updateDisplayingVideosOrder ({ commit, state }) {
      commit('UPDATE_DISPLAYING_VIDEOS_ORDER')

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
