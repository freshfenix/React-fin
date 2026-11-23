import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import AddBookDialog from './AddBookDialog'
import BookCard from './BookCard'
import { bookFilters } from './bookConstants'
import {
  selectBookCounts,
  selectBooks,
  selectBooksReadThisYear,
  selectFilteredBooks,
  selectPagesRead,
  selectReadingBookCount,
} from './booksSelectors'
import './App.css'

function App() {
  const books = useSelector(selectBooks)
  const counts = useSelector(selectBookCounts)
  const booksReadThisYear = useSelector((state) =>
    selectBooksReadThisYear(state, new Date().getFullYear()),
  )
  const readingBookCount = useSelector(selectReadingBookCount)
  const pagesRead = useSelector(selectPagesRead)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const filteredBooks = useSelector((state) =>
    selectFilteredBooks(state, activeFilter, search),
  )

  useEffect(() => {
    if (!isSidebarOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  const activeFilterLabel =
    bookFilters.find((filter) => filter.id === activeFilter)?.label ?? 'Усі книжки'

  return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {isSidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Закрити меню"
        />
      )}
      <aside
        className="sidebar"
        id="library-sidebar"
        aria-hidden={!isSidebarOpen}
      >
        <div className="sidebar-brand-row">
          <a className="brand" href="#" aria-label="Readery — на головну">
            <span className="brand-mark">r.</span>
            <span>
              readery<span className="brand-period">.</span>
            </span>
          </a>
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Закрити меню"
          >
            ×
          </button>
        </div>
        <div className="sidebar-section">
          <p className="sidebar-label">ТВОЯ БІБЛІОТЕКА</p>
          <nav className="main-nav" aria-label="Фільтри бібліотеки">
            {bookFilters.map((filter) => (
              <button
                key={filter.id}
                className={`nav-item ${activeFilter === filter.id ? 'nav-item-active' : ''}`}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.id)
                  setIsSidebarOpen(false)
                }}
              >
                <span className={`nav-icon icon-${filter.id}`} aria-hidden="true" />
                <span>{filter.label}</span>
                <span className="nav-count">{counts[filter.id]}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-note">
          <span className="note-sparkle" aria-hidden="true">
            <span className="sparkle-icon" />
          </span>
          <p className="note-title">Маленький крок</p>
          <p className="note-copy">
            ще кілька сторінок сьогодні — і ти вже ближче до мети.
          </p>
          <span className="note-signature">твій readery</span>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">М</span>
          <div>
            <strong>Моя бібліотека</strong>
            <span>Особистий простір</span>
          </div>
          <span className="more-dots" aria-hidden="true">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              className="menu-toggle"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-controls="library-sidebar"
              aria-expanded={isSidebarOpen}
              aria-label={isSidebarOpen ? 'Меню відкрите' : 'Відкрити меню'}
            >
              <span className="menu-toggle-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>Меню</span>
            </button>
            <div className="breadcrumb">
              <span>Моя бібліотека</span>
              <span className="breadcrumb-divider">/</span>
              <strong>Огляд</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="today-date">Субота, 21 листопада</span>
            <button className="top-avatar" type="button" aria-label="Профіль">
              М
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <span className="eyebrow">ТВІЙ ЧИТАЦЬКИЙ ПРОСТІР</span>
              <h1>
                Книжки, що стають
                <br />
                <em>частиною тебе.</em>
              </h1>
              <p className="welcome-copy">
                Збирай історії, відстежуй свій прогрес і знаходь час для читання.
              </p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => setIsDialogOpen(true)}
            >
              <span className="plus-icon" aria-hidden="true">+</span>
              Додати книжку
            </button>
          </section>

          <section className="stats-row" aria-label="Статистика читання">
            <article className="stat-card stat-highlight">
              <div className="stat-top">
                <span className="stat-icon">◷</span>
                <span className="stat-trend">ТВОЯ ЦІЛЬ</span>
              </div>
              <strong>
                {booksReadThisYear}
                <span className="stat-unit"> / 24</span>
              </strong>
              <span className="stat-caption">книжок прочитано цього року</span>
              <div className="goal-track">
                <span
                  style={{
                    width: `${Math.min((booksReadThisYear / 24) * 100, 100)}%`,
                  }}
                />
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon stat-icon-peach">▤</span>
                <span className="stat-trend">У ТВОЇЙ БІБЛІОТЕЦІ</span>
              </div>
              <strong>{counts['want-to-read']}</strong>
              <span className="stat-caption">книжок чекають на свою чергу</span>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon stat-icon-lavender">
                  <span className="sparkle-icon" aria-hidden="true" />
                </span>
                <span className="stat-trend">ТИ ВЖЕ ПРОЧИТАВ</span>
              </div>
              <strong>{pagesRead.toLocaleString('uk-UA')}</strong>
              <span className="stat-caption">сторінок — це вже цілий світ</span>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon stat-icon-blue">⌁</span>
                <span className="stat-trend">ЗАРАЗ У ПРОЦЕСІ</span>
              </div>
              <strong>{readingBookCount}</strong>
              <span className="stat-caption">
                {readingBookCount === 1 ? 'книжка' : 'книжок'} на твоїй тумбочці
              </span>
            </article>
          </section>

          <section className="library-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ТВОЯ КОЛЕКЦІЯ</span>
                <h2>{activeFilter === 'all' ? 'Мої книжки' : activeFilterLabel}</h2>
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
            <div
              className="filter-tabs"
              role="tablist"
              aria-label="Категорії книжок"
            >
              {bookFilters.map((filter) => (
                <button
                  key={filter.id}
                  className={`filter-tab ${activeFilter === filter.id ? 'filter-tab-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                  <span>{counts[filter.id]}</span>
                </button>
              ))}
            </div>
            {filteredBooks.length > 0 ? (
              <div className="book-grid">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="sparkle-icon" aria-hidden="true" />
                <h3>{search ? 'Нічого не знайшлося' : 'Тут поки тихо'}</h3>
                <p>
                  {search
                    ? 'Спробуй іншу назву чи автора.'
                    : 'Додай книжку, щоб почати свою читацьку історію.'}
                </p>
                {!search && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Знайти книжку <span aria-hidden="true">↗</span>
                  </button>
                )}
              </div>
            )}
          </section>

          <footer className="page-footer">
            <span>Зроблено з любов’ю до читання</span>
            <span>
              одна сторінка за раз{' '}
              <span className="sparkle-icon" aria-hidden="true" />
            </span>
          </footer>
        </div>
      </main>
      {isDialogOpen && (
        <AddBookDialog
          onClose={() => setIsDialogOpen(false)}
          books={books}
        />
      )}
    </div>
  )
}

export default App
