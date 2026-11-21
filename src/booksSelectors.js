import { createSelector } from '@reduxjs/toolkit'

export const selectBooks = (state) => state.books.items

export const selectBookCounts = createSelector([selectBooks], (books) =>
  books.reduce(
    (counts, book) => {
      counts.all += 1
      counts[book.status] += 1
      return counts
    },
    { all: 0, reading: 0, completed: 0, 'want-to-read': 0 },
  ),
)

export const selectReadingBookCount = createSelector(
  [selectBooks],
  (books) => books.filter((book) => book.status === 'reading').length,
)

export const selectPagesRead = createSelector([selectBooks], (books) =>
  books.reduce((total, book) => {
    if (book.status === 'completed' || book.status === 'reading') {
      return total + book.currentPage
    }
    return total
  }, 0),
)

export const selectFilteredBooks = createSelector(
  [
    selectBooks,
    (_state, activeFilter) => activeFilter,
    (_state, _activeFilter, search) => search,
  ],
  (books, activeFilter, search) => {
    const normalizedSearch = search.trim().toLocaleLowerCase('uk')

    return books.filter((book) => {
      const matchesFilter = activeFilter === 'all' || book.status === activeFilter
      const searchText = `${book.title} ${book.author} ${book.genre}`
        .toLocaleLowerCase('uk')
      return matchesFilter && searchText.includes(normalizedSearch)
    })
  },
)
