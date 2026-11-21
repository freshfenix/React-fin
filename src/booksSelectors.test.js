import { describe, expect, it } from 'vitest'
import {
  selectBookCounts,
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

  it('filters by status and a localized search term', () => {
    expect(selectFilteredBooks(state, 'reading', 'сонця')).toEqual([
      state.books.items[0],
    ])
    expect(selectFilteredBooks(state, 'all', 'missing')).toEqual([])
  })
})
