import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { searchGoogleBooks } from './booksApi'

export const STORAGE_KEY = 'readery-books'
const BOOK_STATUSES = new Set(['reading', 'completed', 'want-to-read'])

const starterBooks = [
  {
    id: 'atomic-habits',
    title: 'Атомні звички',
    author: 'Джеймс Клір',
    genre: 'Саморозвиток',
    status: 'reading',
    currentPage: 184,
    totalPages: 320,
    rating: 0,
    color: 'sage',
  },
  {
    id: 'midnight-library',
    title: 'Опівнічна бібліотека',
    author: 'Метт Гейґ',
    genre: 'Художня література',
    status: 'completed',
    currentPage: 288,
    totalPages: 288,
    rating: 5,
    color: 'lavender',
  },
  {
    id: 'designing-your-life',
    title: 'Дизайн вашого життя',
    author: 'Білл Барнетт, Дейв Еванс',
    genre: 'Саморозвиток',
    status: 'want-to-read',
    currentPage: 0,
    totalPages: 256,
    rating: 0,
    color: 'peach',
  },
  {
    id: 'little-prince',
    title: 'Маленький принц',
    author: 'Антуан де Сент-Екзюпері',
    genre: 'Класика',
    status: 'completed',
    currentPage: 96,
    totalPages: 96,
    rating: 5,
    color: 'blue',
  },
  {
    id: 'creative-act',
    title: 'Творчий акт',
    author: 'Рік Рубін',
    genre: 'Мистецтво',
    status: 'reading',
    currentPage: 72,
    totalPages: 432,
    rating: 0,
    color: 'rose',
  },
]

function loadBooks() {
  if (typeof localStorage === 'undefined') return starterBooks

  try {
    const savedBooks = localStorage.getItem(STORAGE_KEY)
    if (!savedBooks) return starterBooks

    const parsedBooks = JSON.parse(savedBooks)
    const isValidBook = (book) =>
      book &&
      typeof book === 'object' &&
      typeof book.id === 'string' &&
      typeof book.title === 'string' &&
      typeof book.author === 'string' &&
      typeof book.genre === 'string' &&
      BOOK_STATUSES.has(book.status) &&
      Number.isFinite(book.currentPage) &&
      book.currentPage >= 0 &&
      Number.isFinite(book.totalPages) &&
      book.totalPages >= 0 &&
      Number.isInteger(book.rating) &&
      book.rating >= 0 &&
      book.rating <= 5

    if (!Array.isArray(parsedBooks) || !parsedBooks.every(isValidBook)) {
      console.error('Збережена бібліотека має некоректний формат.')
      return starterBooks
    }

    return parsedBooks
  } catch (error) {
    console.error('Не вдалося завантажити бібліотеку з localStorage:', error)
    return starterBooks
  }
}

export const searchBooks = createAsyncThunk(
  'books/search',
  async (query, { rejectWithValue, signal }) => {
    const normalizedQuery = typeof query === 'string' ? query.trim() : ''
    if (!normalizedQuery) {
      return rejectWithValue('Введіть назву книжки або автора.')
    }

    try {
      return await searchGoogleBooks(normalizedQuery, { signal })
    } catch (error) {
      if (signal.aborted) throw error
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Помилка з’єднання. Перевірте інтернет і спробуйте ще раз.',
      )
    }
  },
)

const booksSlice = createSlice({
  name: 'books',
  initialState: {
    items: loadBooks(),
    searchResults: [],
    searchStatus: 'idle',
    searchError: null,
  },
  reducers: {
    addBook(state, action) {
      const alreadyExists = state.items.some((book) => book.id === action.payload.id)
      if (!alreadyExists) state.items.unshift(action.payload)
    },
    updateBookStatus(state, action) {
      const book = state.items.find((item) => item.id === action.payload.id)
      if (!book) return

      book.status = action.payload.status
      if (book.status === 'completed') book.currentPage = book.totalPages
      if (book.status === 'reading' && book.currentPage === book.totalPages) {
        book.currentPage = 0
      }
    },
    addReadingProgress(state, action) {
      const book = state.items.find((item) => item.id === action.payload)
      if (!book || book.status !== 'reading') return

      book.currentPage += 10
      if (book.totalPages && book.currentPage >= book.totalPages) {
        book.currentPage = book.totalPages
        book.status = 'completed'
      }
    },
    removeBook(state, action) {
      state.items = state.items.filter((book) => book.id !== action.payload)
    },
  },
  extraReducers(builder) {
    builder
      .addCase(searchBooks.pending, (state) => {
        state.searchStatus = 'loading'
        state.searchError = null
        state.searchResults = []
      })
      .addCase(searchBooks.fulfilled, (state, action) => {
        state.searchStatus = 'succeeded'
        state.searchResults = action.payload
      })
      .addCase(searchBooks.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.searchStatus = 'idle'
          state.searchError = null
          return
        }

        state.searchStatus = 'failed'
        state.searchError = action.payload ?? action.error.message
      })
  },
})

export const { addBook, updateBookStatus, addReadingProgress, removeBook } =
  booksSlice.actions
export default booksSlice.reducer
