export default function BookCover({ book }) {
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
