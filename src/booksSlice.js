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

function normalizeBook(book) {
  return {
    ...book,
    completionHistory:
      book.completionHistory ??
      (book.status === 'completed'
        ? [{ completedAt: null, pages: book.currentPage }]
        : []),
  }
}

function getStarterBooks() {
  return starterBooks.map(normalizeBook)
}

function loadBooks() {
  if (typeof localStorage === 'undefined') return getStarterBooks()

  try {
    const savedBooks = localStorage.getItem(STORAGE_KEY)
    if (!savedBooks) return getStarterBooks()

    const parsedBooks = JSON.parse(savedBooks)
    const isValidCompletion = (completion) =>
      completion &&
      typeof completion === 'object' &&
      Number.isFinite(completion.pages) &&
      completion.pages >= 0 &&
      (completion.completedAt === null ||
        (typeof completion.completedAt === 'string' &&
          Number.isFinite(Date.parse(completion.completedAt))))
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
      book.rating <= 5 &&
      (book.completionHistory === undefined ||
        (Array.isArray(book.completionHistory) &&
          book.completionHistory.every(isValidCompletion)))

    if (!Array.isArray(parsedBooks) || !parsedBooks.every(isValidBook)) {
      console.error('Збережена бібліотека має некоректний формат.')
      return getStarterBooks()
    }

    return parsedBooks.map(normalizeBook)
  } catch (error) {
    console.error('Не вдалося завантажити бібліотеку з localStorage:', error)
    return getStarterBooks()
  }
}

function completeBook(book) {
  const pages = book.totalPages > 0 ? book.totalPages : book.currentPage
  book.status = 'completed'
  book.currentPage = pages
  book.completionHistory ??= []
  book.completionHistory.push({
    completedAt: new Date().toISOString(),
    pages,
  })
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
    searchRequestId: null,
  },
  reducers: {
    addBook(state, action) {
      const alreadyExists = state.items.some((book) => book.id === action.payload.id)
      if (!alreadyExists) state.items.unshift(normalizeBook(action.payload))
    },
    updateBookStatus(state, action) {
      const book = state.items.find((item) => item.id === action.payload.id)
      if (!book) return

      const wasCompleted = book.status === 'completed'
      if (action.payload.status === 'completed' && !wasCompleted) {
        completeBook(book)
        return
      }

      book.status = action.payload.status
      if (
        book.status === 'reading' &&
        (wasCompleted || book.currentPage === book.totalPages)
      ) {
        book.currentPage = 0
      }
    },
    addReadingProgress(state, action) {
      const book = state.items.find((item) => item.id === action.payload)
      if (!book || book.status !== 'reading') return

      book.currentPage += 10
      if (book.totalPages && book.currentPage >= book.totalPages) {
        completeBook(book)
      }
    },
    removeBook(state, action) {
      state.items = state.items.filter((book) => book.id !== action.payload)
    },
    clearBookSearch(state) {
      state.searchResults = []
      state.searchStatus = 'idle'
      state.searchError = null
      state.searchRequestId = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(searchBooks.pending, (state, action) => {
        state.searchStatus = 'loading'
        state.searchError = null
        state.searchResults = []
        state.searchRequestId = action.meta.requestId
      })
      .addCase(searchBooks.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.searchRequestId) return

        state.searchStatus = 'succeeded'
        state.searchResults = action.payload
        state.searchRequestId = null
      })
      .addCase(searchBooks.rejected, (state, action) => {
        if (action.meta.requestId !== state.searchRequestId) return

        state.searchRequestId = null
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

export const {
  addBook,
  updateBookStatus,
  addReadingProgress,
  removeBook,
  clearBookSearch,
} = booksSlice.actions
export default booksSlice.reducer
