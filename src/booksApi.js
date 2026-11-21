const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes'

export async function searchGoogleBooks(query, { signal } = {}) {
  let response
  try {
    response = await fetch(
      `${GOOGLE_BOOKS_URL}?q=${encodeURIComponent(query)}&maxResults=8`,
      { signal },
    )
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(
      'Помилка з’єднання. Перевірте інтернет і спробуйте ще раз.',
      { cause: error },
    )
  }

  if (response.status === 429) {
    throw new Error(
      'Каталог тимчасово обмежив запити. Спробуйте пізніше або додайте книжку вручну.',
    )
  }

  if (!response.ok) {
    throw new Error('Не вдалося знайти книжки. Спробуйте ще раз.')
  }

  let data
  try {
    data = await response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('Каталог повернув некоректну відповідь.', { cause: error })
  }

  return (Array.isArray(data.items) ? data.items : [])
    .filter((item) => item && typeof item.id === 'string')
    .map(({ id, volumeInfo }) => {
      const bookInfo =
        volumeInfo && typeof volumeInfo === 'object' ? volumeInfo : {}
      const authors = Array.isArray(bookInfo.authors) ? bookInfo.authors : []
      const categories = Array.isArray(bookInfo.categories)
        ? bookInfo.categories
        : []
      const thumbnail = bookInfo.imageLinks?.thumbnail

      return {
        id: `google-${id}`,
        title: bookInfo.title ?? 'Без назви',
        author: authors.join(', ') || 'Автор невідомий',
        genre: categories[0]?.split('/')[0]?.trim() || 'Інше',
        status: 'want-to-read',
        currentPage: 0,
        totalPages:
          Number.isFinite(bookInfo.pageCount) && bookInfo.pageCount >= 0
            ? bookInfo.pageCount
            : 0,
        rating: 0,
        cover:
          typeof thumbnail === 'string'
            ? thumbnail.replace('http://', 'https://')
            : undefined,
        color: 'blue',
      }
    })
}
