import { defineStore } from './utils'

interface Store {
  count: number
  add: () => void
  dec: () => void
}

const useCountStore = defineStore<Store>((set) => ({
  count: 0,
  add() {
    set(state => {
      state.count++
    })
  },
  dec() {
    set(state => {
      state.count--
    })
  }
}))

export default useCountStore