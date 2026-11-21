import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addBook, searchBooks } from './booksSlice'
import BookCover from './BookCover'

export default function AddBookDialog({ onClose, books }) {
  const dispatch = useDispatch()
  const { searchResults, searchStatus, searchError } = useSelector(
    (state) => state.books,
  )
  const [query, setQuery] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualAuthor, setManualAuthor] = useState('')
  const [manualGenre, setManualGenre] = useState('')
  const existingIds = new Set(books.map((book) => book.id))

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSearch(event) {
    event.preventDefault()
    if (query.trim()) dispatch(searchBooks(query.trim()))
  }

  function handleAdd(book) {
    dispatch(addBook(book))
    onClose()
  }

  function handleManualAdd(event) {
    event.preventDefault()
    const title = manualTitle.trim()
    if (!title) return

    handleAdd({
      id: `manual-${globalThis.crypto.randomUUID()}`,
      title,
      author: manualAuthor.trim() || 'Автор невідомий',
      genre: manualGenre.trim() || 'Інше',
      status: 'want-to-read',
      currentPage: 0,
      totalPages: 0,
      rating: 0,
      color: 'sage',
    })
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="add-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">ВАША НАСТУПНА ІСТОРІЯ</span>
            <h2 id="dialog-title">Знайти книжку</h2>
          </div>
          <button
            className="close-dialog"
            type="button"
            onClick={onClose}
            aria-label="Закрити"
          >
            ×
          </button>
        </div>
        <p className="dialog-intro">
          Знайдіть видання в каталозі або додайте його вручну.
        </p>
        <form className="api-search" onSubmit={handleSearch}>
          <span aria-hidden="true">⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Назва книжки або автор"
            aria-label="Пошук у каталозі Google Books"
          />
          <button
            type="submit"
            disabled={!query.trim() || searchStatus === 'loading'}
          >
            {searchStatus === 'loading' ? 'Шукаємо…' : 'Знайти'}
          </button>
        </form>
        <div className="search-results" aria-live="polite">
          {searchStatus === 'loading' && (
            <p className="search-message">Переглядаємо книжкові полиці…</p>
          )}
          {searchStatus === 'failed' && (
            <p className="search-message search-error">{searchError}</p>
          )}
          {searchStatus === 'succeeded' && searchResults.length === 0 && (
            <p className="search-message">
              Нічого не знайшли. Спробуйте інший запит.
            </p>
          )}
          {searchResults.map((book) => (
            <article className="search-result" key={book.id}>
              <BookCover book={book} />
              <div className="result-info">
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <span>{book.genre}</span>
              </div>
              <button
                type="button"
                className="result-add"
                onClick={() => handleAdd(book)}
                disabled={existingIds.has(book.id)}
              >
                {existingIds.has(book.id) ? 'У бібліотеці' : '+ Додати'}
              </button>
            </article>
          ))}
        </div>
        <div className="manual-add">
          <div className="manual-heading">
            <h3>Додати вручну</h3>
            <span>якщо не знайшли потрібну</span>
          </div>
          <form onSubmit={handleManualAdd}>
            <div className="manual-fields">
              <label>
                Назва книжки
                <input
                  required
                  value={manualTitle}
                  onChange={(event) => setManualTitle(event.target.value)}
                  placeholder="Наприклад, назва роману"
                />
              </label>
              <label>
                Автор
                <input
                  value={manualAuthor}
                  onChange={(event) => setManualAuthor(event.target.value)}
                  placeholder="Ім’я автора"
                />
              </label>
              <label className="manual-genre">
                Жанр
                <input
                  value={manualGenre}
                  onChange={(event) => setManualGenre(event.target.value)}
                  placeholder="Наприклад, фантастика"
                />
              </label>
            </div>
            <button
              className="manual-submit"
              type="submit"
              disabled={!manualTitle.trim()}
            >
              Додати до бібліотеки <span aria-hidden="true">↗</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
