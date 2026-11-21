import { configureStore } from '@reduxjs/toolkit'
import booksReducer, { STORAGE_KEY } from './booksSlice'

const store = configureStore({
  reducer: {
    books: booksReducer,
  },
})

let previousItems = store.getState().books.items

store.subscribe(() => {
  const nextItems = store.getState().books.items
  if (nextItems === previousItems) return

  previousItems = nextItems
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
  } catch (error) {
    console.error('Не вдалося зберегти бібліотеку в localStorage:', error)
  }
})

export default store
