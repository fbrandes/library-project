package com.example.bookinfo

import com.example.bookinfo.api.model.Address
import com.example.bookinfo.api.model.Author
import com.example.bookinfo.api.model.Book
import com.example.bookinfo.api.model.BookType
import com.example.bookinfo.api.model.Publisher
import com.example.bookinfo.repository.BookDocument
import java.time.LocalDate
import java.util.UUID

val testBookUuid: UUID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000")

fun testAuthor() =
    Author(
        firstname = "Joshua",
        middlename = "",
        lastname = "Bloch",
        bio = "Software engineer and author focused on Java.",
    )

fun testPublisher() =
    Publisher(
        name = "Addison-Wesley Professional",
        address =
            Address(
                street = "75 Arlington Street",
                zipCode = "02116",
                city = "Boston",
            ),
    )

fun testBook(
    id: UUID? = testBookUuid,
    title: String = "Effective Java",
) = Book(
    id = id,
    isbn = "9780134685991",
    title = title,
    author = testAuthor(),
    pages = 416,
    publisher = testPublisher(),
    genres = listOf("Programming", "Java"),
    language = "English",
    summary = "A practical guide to writing robust Java code.",
    publicationDate = LocalDate.parse("2018-01-06"),
    edition = 3,
    type = BookType.HARDCOVER,
)

fun testBookEntity(
    id: UUID? = testBookUuid,
    title: String = "Effective Java",
) = BookDocument(
    id = id,
    isbn = "9780134685991",
    title = title,
    author = testAuthor(),
    pages = 416,
    publisher = testPublisher(),
    genres = listOf("Programming", "Java"),
    language = "English",
    summary = "A practical guide to writing robust Java code.",
    publicationDate = LocalDate.parse("2018-01-06"),
    edition = 3,
    type = BookType.HARDCOVER,
)

fun testBookJson(
    isbn: String = "9780134685991",
    title: String = "Effective Java",
    firstname: String = "Joshua",
    lastname: String = "Bloch",
    pages: Int = 416,
    publisherName: String = "Addison-Wesley Professional",
    language: String = "English",
    summary: String = "A practical guide to writing robust Java code.",
    publicationDate: String = "2018-01-06",
    edition: Int = 3,
    type: String = "HARDCOVER",
) = """
    {
      "isbn": "$isbn",
      "title": "$title",
      "author": {
        "firstname": "$firstname",
        "middlename": "",
        "lastname": "$lastname",
        "bio": "Software engineer and author focused on Java."
      },
      "pages": $pages,
      "publisher": {
        "name": "$publisherName",
        "address": {
          "street": "75 Arlington Street",
          "zipCode": "02116",
          "city": "Boston"
        }
      },
      "genres": ["Programming", "Java"],
      "language": "$language",
      "summary": "$summary",
      "publicationDate": "$publicationDate",
      "edition": $edition,
      "type": "$type"
    }
    """.trimIndent()
