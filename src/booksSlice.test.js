import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let booksReducer
let actions
let storage

beforeEach(async () => {
  vi.resetModules()
  storage = new Map()
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => storage.get(key) ?? null),
    setItem: vi.fn((key, value) => storage.set(key, value)),
  })

  actions = await import('./booksSlice')
  booksReducer = actions.default
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function createBook(overrides = {}) {
  return {
    id: 'test-book',
    title: 'Тестова книжка',
    author: 'Тестовий автор',
    genre: 'Тест',
    status: 'want-to-read',
    currentPage: 0,
    totalPages: 100,
    rating: 0,
    color: 'sage',
    ...overrides,
  }
}

describe('books reducer', () => {
  it('adds a book only once by ID', () => {
    let state = booksReducer(undefined, { type: 'init' })
    const book = createBook()

    state = booksReducer(state, actions.addBook(book))
    state = booksReducer(state, actions.addBook(book))

    expect(state.items.filter((item) => item.id === book.id)).toHaveLength(1)
  })

  it('completes a book when reading progress reaches its page count', () => {
    let state = booksReducer(undefined, { type: 'init' })
    state = booksReducer(
      state,
      actions.addBook(createBook({ status: 'reading', currentPage: 95, totalPages: 100 })),
    )

    state = booksReducer(state, actions.addReadingProgress('test-book'))

    const book = state.items.find((item) => item.id === 'test-book')
    expect(book).toMatchObject({ status: 'completed', currentPage: 100 })
  })

  it('updates status and resets progress when restarting a completed book', () => {
    let state = booksReducer(undefined, { type: 'init' })
    state = booksReducer(
      state,
      actions.addBook(createBook({ status: 'reading', currentPage: 24 })),
    )
    state = booksReducer(
      state,
      actions.updateBookStatus({ id: 'test-book', status: 'completed' }),
    )
    state = booksReducer(
      state,
      actions.updateBookStatus({ id: 'test-book', status: 'reading' }),
    )

    expect(state.items.find((item) => item.id === 'test-book')).toMatchObject({
      status: 'reading',
      currentPage: 0,
    })
  })

  it('tracks progress when the total page count is unknown', () => {
    let state = booksReducer(undefined, { type: 'init' })
    state = booksReducer(
      state,
      actions.addBook(createBook({ status: 'reading', totalPages: 0 })),
    )

    state = booksReducer(state, actions.addReadingProgress('test-book'))

    expect(state.items.find((item) => item.id === 'test-book')).toMatchObject({
      status: 'reading',
      currentPage: 10,
      totalPages: 0,
    })
  })

  it('removes a book from the library', () => {
    let state = booksReducer(undefined, { type: 'init' })
    state = booksReducer(state, actions.addBook(createBook()))
    state = booksReducer(state, actions.removeBook('test-book'))

    expect(state.items.some((item) => item.id === 'test-book')).toBe(false)
  })

  it('restores starter books if saved data is malformed', async () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
    storage.set('readery-books', JSON.stringify([{ id: 'incomplete' }]))
    vi.resetModules()

    const { default: reducer } = await import('./booksSlice')
    const state = reducer(undefined, { type: 'init' })

    expect(state.items).toHaveLength(5)
    expect(logError).toHaveBeenCalledOnce()
  })

  it('does not persist search-only state updates', async () => {
    const { default: store } = await import('./store')
    const setItem = vi.spyOn(localStorage, 'setItem')

    store.dispatch(actions.searchBooks.pending('request-id', 'query'))
    expect(setItem).not.toHaveBeenCalled()

    store.dispatch(actions.addBook(createBook()))
    expect(setItem).toHaveBeenCalledWith(
      actions.STORAGE_KEY,
      expect.stringContaining('"test-book"'),
    )
  })
})

describe('searchBooks thunk', () => {
  it('maps Google Books results and ignores malformed entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 'book-1',
              volumeInfo: {
                title: 'A Book',
                authors: ['An Author'],
                categories: ['Fiction / Fantasy'],
                pageCount: 123,
                imageLinks: { thumbnail: 'http://example.test/cover.jpg' },
              },
            },
            { id: 'book-2', volumeInfo: null },
            null,
            { volumeInfo: { title: 'Missing ID' } },
          ],
        }),
      }),
    )
    const store = configureStore({ reducer: { books: booksReducer } })

    const result = await store.dispatch(actions.searchBooks('  A Book  '))

    expect(result.payload).toEqual([
      expect.objectContaining({
        id: 'google-book-1',
        title: 'A Book',
        author: 'An Author',
        genre: 'Fiction',
        totalPages: 123,
        cover: 'https://example.test/cover.jpg',
      }),
      expect.objectContaining({
        id: 'google-book-2',
        title: 'Без назви',
        author: 'Автор невідомий',
      }),
    ])
    expect(store.getState().books.searchStatus).toBe('succeeded')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=A%20Book'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('reports rate limits with a manual-add fallback message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    )
    const store = configureStore({ reducer: { books: booksReducer } })

    const result = await store.dispatch(actions.searchBooks('A Book'))

    expect(result.payload).toContain('додайте книжку вручну')
    expect(store.getState().books.searchStatus).toBe('failed')
  })

  it('does not call the API for an empty query', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const store = configureStore({ reducer: { books: booksReducer } })

    const result = await store.dispatch(actions.searchBooks('   '))

    expect(result.payload).toContain('Введіть назву')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns to idle when a request is aborted', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const store = configureStore({ reducer: { books: booksReducer } })
    const request = store.dispatch(actions.searchBooks('A Book'))

    request.abort()
    const result = await request

    expect(result.meta.aborted).toBe(true)
    expect(store.getState().books.searchStatus).toBe('idle')
    expect(store.getState().books.searchError).toBeNull()
  })
})
