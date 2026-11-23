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

export const selectBooksReadThisYear = createSelector(
  [selectBooks, (_state, year) => year],
  (books, year) =>
    books.reduce(
      (total, book) =>
        total +
        (book.completionHistory ?? []).filter(({ completedAt }) => {
          if (!completedAt) return false
          const date = new Date(completedAt)
          return Number.isFinite(date.getTime()) && date.getFullYear() === year
        }).length,
      0,
    ),
)

export const selectPagesRead = createSelector([selectBooks], (books) =>
  books.reduce((total, book) => {
    const completionHistory =
      book.completionHistory ??
      (book.status === 'completed'
        ? [{ pages: book.currentPage }]
        : [])
    const completedPages = completionHistory.reduce(
      (pages, completion) => pages + completion.pages,
      0,
    )
    return total + completedPages + (book.status === 'reading' ? book.currentPage : 0)
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
