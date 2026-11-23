import { describe, expect, it } from 'vitest'
import {
  selectBookCounts,
  selectBooksReadThisYear,
  selectFilteredBooks,
  selectPagesRead,
  selectReadingBookCount,
} from './booksSelectors'

const state = {
  books: {
    items: [
      {
        id: 'one',
        title: 'Місто сонця',
        author: 'Автор один',
        genre: 'Фентезі',
        status: 'reading',
        currentPage: 30,
        totalPages: 100,
      },
      {
        id: 'two',
        title: 'Далеке море',
        author: 'Автор два',
        genre: 'Роман',
        status: 'completed',
        currentPage: 120,
        totalPages: 120,
      },
      {
        id: 'three',
        title: 'Новий світ',
        author: 'Автор три',
        genre: 'Фантастика',
        status: 'want-to-read',
        currentPage: 0,
        totalPages: 200,
      },
    ],
  },
}

describe('book selectors', () => {
  it('calculates status counts and reading pages', () => {
    expect(selectBookCounts(state)).toEqual({
      all: 3,
      reading: 1,
      completed: 1,
      'want-to-read': 1,
    })
    expect(selectReadingBookCount(state)).toBe(1)
    expect(selectPagesRead(state)).toBe(150)
  })

  it('counts dated completions by year and retains pages from earlier reads', () => {
    const historyState = {
      books: {
        items: [
          {
            ...state.books.items[0],
            currentPage: 10,
            completionHistory: [
              { completedAt: '2026-03-15T12:00:00.000Z', pages: 96 },
            ],
          },
          {
            ...state.books.items[1],
            status: 'reading',
            currentPage: 12,
            completionHistory: [{ completedAt: null, pages: 120 }],
          },
          {
            ...state.books.items[2],
            status: 'completed',
            currentPage: 50,
            completionHistory: [
              { completedAt: '2025-11-03T12:00:00.000Z', pages: 50 },
            ],
          },
        ],
      },
    }

    expect(selectBooksReadThisYear(historyState, 2026)).toBe(1)
    expect(selectBooksReadThisYear(historyState, 2025)).toBe(1)
    expect(selectBooksReadThisYear(state, 2026)).toBe(0)
    expect(selectPagesRead(historyState)).toBe(288)
  })

  it('filters by status and a localized search term', () => {
    expect(selectFilteredBooks(state, 'reading', 'сонця')).toEqual([
      state.books.items[0],
    ])
    expect(selectFilteredBooks(state, 'all', 'missing')).toEqual([])
  })
})
