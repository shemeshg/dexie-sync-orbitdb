import { createStore } from 'vuex'
import {  db } from "../components/DexieExample/db";

export default createStore({
  state: {
    myList: []
  },
  mutations: {
    refreshList (state, data) {
      state.myList=data
    },
  },
  actions: {
    refreshList: async({ commit }) => {
      const data = await db.friends.toArray()
      commit('refreshList', data)
    },
  },
  modules: {
  }
})
