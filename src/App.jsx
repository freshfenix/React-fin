import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  addBook,
  addReadingProgress,
  removeBook,
  searchBooks,
  updateBookStatus,
} from './booksSlice'
import './App.css'

const filters = [
  { id: 'all', label: 'Усі книжки' },
  { id: 'reading', label: 'Читаю зараз' },
  { id: 'completed', label: 'Прочитані' },
  { id: 'want-to-read', label: 'Хочу прочитати' },
]

const statusLabels = {
  reading: 'Читаю зараз',
  completed: 'Прочитано',
  'want-to-read': 'У планах',
}

function BookCover({ book }) {
  return (
    <div
      className={`book-cover cover-${book.color ?? 'blue'}`}
      style={book.cover ? { backgroundImage: `url("${book.cover}")` } : undefined}
      role="img"
      aria-label={`Обкладинка книжки «${book.title}»`}
    >
      {!book.cover && (
        <>
          <span className="cover-mark" aria-hidden="true">✳</span>
          <span className="cover-title">{book.title}</span>
          <span className="cover-author">{book.author}</span>
        </>
      )}
    </div>
  )
}

function BookCard({ book }) {
  const dispatch = useDispatch()
  const progress = book.totalPages
    ? Math.min(Math.round((book.currentPage / book.totalPages) * 100), 100)
    : 0

  function advanceBook() {
    if (book.status === 'want-to-read') {
      dispatch(updateBookStatus({ id: book.id, status: 'reading' }))
    } else if (book.status === 'reading') {
      dispatch(addReadingProgress(book.id))
    } else {
      dispatch(updateBookStatus({ id: book.id, status: 'reading' }))
    }
  }

  return (
    <article className="book-card">
      <div className="cover-wrap">
        <BookCover book={book} />
        <span className={`status-pill status-${book.status}`}>
          <span className="status-dot" />
          {statusLabels[book.status]}
        </span>
        <button
          className="remove-book"
          type="button"
          onClick={() => dispatch(removeBook(book.id))}
          aria-label={`Видалити «${book.title}»`}
          title="Видалити книжку"
        >
          ×
        </button>
      </div>
      <div className="book-details">
        <span className="book-genre">{book.genre}</span>
        <h3>{book.title}</h3>
        <p className="book-author">{book.author}</p>
        {book.status === 'reading' ? (
          <div className="progress-block">
            <div className="progress-caption">
              <span>
                {book.totalPages
                  ? `${book.currentPage} з ${book.totalPages} стор.`
                  : `${book.currentPage} стор.`}
              </span>
              {book.totalPages > 0 && <span>{progress}%</span>}
            </div>
            {book.totalPages > 0 && (
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div className="book-meta">
            <span>{book.totalPages ? `${book.totalPages} сторінок` : 'Книжка'}</span>
            {book.status === 'completed' && (
              <span className="book-rating" aria-label={`Оцінка: ${book.rating} з 5`}>
                {'★'.repeat(book.rating || 5)}
              </span>
            )}
          </div>
        )}
        <button className="book-action" type="button" onClick={advanceBook}>
          {book.status === 'reading'
            ? 'Прочитати +10 сторінок'
            : book.status === 'completed'
              ? 'Читати ще раз'
              : 'Почати читати'}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  )
}

function AddBookDialog({ onClose, books }) {
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
          <button className="close-dialog" type="button" onClick={onClose} aria-label="Закрити">
            ×
          </button>
        </div>
        <p className="dialog-intro">Знайдіть видання в каталозі або додайте його вручну.</p>
        <form className="api-search" onSubmit={handleSearch}>
          <span aria-hidden="true">⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Назва книжки або автор"
            aria-label="Пошук у каталозі Google Books"
          />
          <button type="submit" disabled={!query.trim() || searchStatus === 'loading'}>
            {searchStatus === 'loading' ? 'Шукаємо…' : 'Знайти'}
          </button>
        </form>
        <div className="search-results" aria-live="polite">
          {searchStatus === 'loading' && <p className="search-message">Переглядаємо книжкові полиці…</p>}
          {searchStatus === 'failed' && <p className="search-message search-error">{searchError}</p>}
          {searchStatus === 'succeeded' && searchResults.length === 0 && (
            <p className="search-message">Нічого не знайшли. Спробуйте інший запит.</p>
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
            <button className="manual-submit" type="submit" disabled={!manualTitle.trim()}>
              Додати до бібліотеки <span aria-hidden="true">↗</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

function App() {
  const books = useSelector((state) => state.books.items)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const counts = useMemo(
    () => ({
      all: books.length,
      reading: books.filter((book) => book.status === 'reading').length,
      completed: books.filter((book) => book.status === 'completed').length,
      'want-to-read': books.filter((book) => book.status === 'want-to-read').length,
    }),
    [books],
  )
  const filteredBooks = books.filter((book) => {
    const matchesFilter = activeFilter === 'all' || book.status === activeFilter
    const searchText = `${book.title} ${book.author} ${book.genre}`.toLocaleLowerCase('uk')
    return matchesFilter && searchText.includes(search.trim().toLocaleLowerCase('uk'))
  })
  const completedThisYear = counts.completed
  const readingBooks = books.filter((book) => book.status === 'reading')
  const pagesRead = books.reduce((total, book) => {
    if (book.status === 'completed') return total + book.totalPages
    if (book.status === 'reading') return total + book.currentPage
    return total
  }, 0)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Readery — на головну">
          <span className="brand-mark">r.</span>
          <span>readery<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-section">
          <p className="sidebar-label">ТВОЯ БІБЛІОТЕКА</p>
          <nav className="main-nav" aria-label="Фільтри бібліотеки">
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={`nav-item ${activeFilter === filter.id ? 'nav-item-active' : ''}`}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
              >
                <span className={`nav-icon icon-${filter.id}`} aria-hidden="true" />
                <span>{filter.label}</span>
                <span className="nav-count">{counts[filter.id]}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-note">
          <span className="note-sparkle">✳</span>
          <p className="note-title">Маленький крок</p>
          <p className="note-copy">ще кілька сторінок сьогодні — і ти вже ближче до мети.</p>
          <span className="note-signature">твій readery</span>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">М</span>
          <div><strong>Моя бібліотека</strong><span>Особистий простір</span></div>
          <span className="more-dots" aria-hidden="true">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Моя бібліотека</span><span className="breadcrumb-divider">/</span><strong>Огляд</strong></div>
          <div className="topbar-actions">
            <span className="today-date">Субота, 21 листопада</span>
            <button className="top-avatar" type="button" aria-label="Профіль">М</button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <span className="eyebrow">ТВІЙ ЧИТАЦЬКИЙ ПРОСТІР</span>
              <h1>Книжки, що стають<br /><em>частиною тебе.</em></h1>
              <p className="welcome-copy">Збирай історії, відстежуй свій прогрес і знаходь час для читання.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => setIsDialogOpen(true)}>
              <span className="plus-icon" aria-hidden="true">+</span> Додати книжку
            </button>
          </section>

          <section className="stats-row" aria-label="Статистика читання">
            <article className="stat-card stat-highlight">
              <div className="stat-top"><span className="stat-icon">◷</span><span className="stat-trend">ТВОЯ ЦІЛЬ</span></div>
              <strong>{completedThisYear}<span className="stat-unit"> / 24</span></strong>
              <span className="stat-caption">книжок прочитано цього року</span>
              <div className="goal-track"><span style={{ width: `${Math.min((completedThisYear / 24) * 100, 100)}%` }} /></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon stat-icon-peach">▤</span><span className="stat-trend">У ТВОЇЙ БІБЛІОТЕЦІ</span></div>
              <strong>{books.length}</strong>
              <span className="stat-caption">книжок чекають на свою чергу</span>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon stat-icon-lavender">✳</span><span className="stat-trend">ТИ ВЖЕ ПРОЧИТАВ</span></div>
              <strong>{pagesRead.toLocaleString('uk-UA')}</strong>
              <span className="stat-caption">сторінок — це вже цілий світ</span>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon stat-icon-blue">⌁</span><span className="stat-trend">ЗАРАЗ У ПРОЦЕСІ</span></div>
              <strong>{readingBooks.length}</strong>
              <span className="stat-caption">{readingBooks.length === 1 ? 'книжка' : 'книжок'} на твоїй тумбочці</span>
            </article>
          </section>

          <section className="library-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ТВОЯ КОЛЕКЦІЯ</span>
                <h2>{activeFilter === 'all' ? 'Мої книжки' : filters.find((filter) => filter.id === activeFilter)?.label}</h2>
              </div>
              <label className="library-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Знайти у бібліотеці"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Знайти книжку у бібліотеці"
                />
                <kbd>⌘ K</kbd>
              </label>
            </div>
            <div className="filter-tabs" role="tablist" aria-label="Категорії книжок">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  className={`filter-tab ${activeFilter === filter.id ? 'filter-tab-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}<span>{counts[filter.id]}</span>
                </button>
              ))}
            </div>
            {filteredBooks.length > 0 ? (
              <div className="book-grid">
                {filteredBooks.map((book) => <BookCard key={book.id} book={book} />)}
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">✳</span>
                <h3>{search ? 'Нічого не знайшлося' : 'Тут поки тихо'}</h3>
                <p>{search ? 'Спробуй іншу назву чи автора.' : 'Додай книжку, щоб почати свою читацьку історію.'}</p>
                {!search && <button className="text-button" type="button" onClick={() => setIsDialogOpen(true)}>Знайти книжку <span aria-hidden="true">↗</span></button>}
              </div>
            )}
          </section>

          <footer className="page-footer"><span>Зроблено з любов’ю до читання</span><span>одна сторінка за раз <span aria-hidden="true">✳</span></span></footer>
        </div>
      </main>
      {isDialogOpen && <AddBookDialog onClose={() => setIsDialogOpen(false)} books={books} />}
    </div>
  )
}

export default App
