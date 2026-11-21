import { useDispatch } from 'react-redux'
import {
  addReadingProgress,
  removeBook,
  updateBookStatus,
} from './booksSlice'
import { bookStatusLabels } from './bookConstants'
import BookCover from './BookCover'

export default function BookCard({ book }) {
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
          {bookStatusLabels[book.status]}
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
                {Array.from({ length: book.rating || 5 }, (_, index) => (
                  <span className="rating-star" key={index} aria-hidden="true" />
                ))}
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
