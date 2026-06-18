package com.example.bookinfo.controller

import com.example.bookinfo.service.BookNotFoundException
import com.example.bookinfo.service.BookService
import com.example.bookinfo.testBook
import com.example.bookinfo.testBookJson
import com.example.bookinfo.testBookUuid
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.SpringBootConfiguration
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.dao.DuplicateKeyException
import org.springframework.http.MediaType
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put

@SpringBootTest(classes = [BookControllerTest.TestApplication::class])
@AutoConfigureMockMvc
class BookControllerTest(
    @Autowired private val mockMvc: MockMvc,
) {
    @MockitoBean
    private lateinit var bookService: BookService

    private val bookUuid = testBookUuid

    @Test
    fun `getBooks returns all books`() {
        val books = listOf(testBook())
        whenever(bookService.getBooks()).thenReturn(books)

        mockMvc
            .get("/books") {
                accept = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].id") { value(bookUuid.toString()) }
                jsonPath("$[0].isbn") { value("9780134685991") }
                jsonPath("$[0].title") { value("Effective Java") }
                jsonPath("$[0].author.firstname") { value("Joshua") }
                jsonPath("$[0].author.lastname") { value("Bloch") }
                jsonPath("$[0].pages") { value(416) }
                jsonPath("$[0].publisher.name") { value("Addison-Wesley Professional") }
                jsonPath("$[0].publisher.address.city") { value("Boston") }
                jsonPath("$[0].genres[0]") { value("Programming") }
                jsonPath("$[0].language") { value("English") }
                jsonPath("$[0].summary") { value("A practical guide to writing robust Java code.") }
                jsonPath("$[0].publicationDate") { value("2018-01-06") }
                jsonPath("$[0].edition") { value(3) }
                jsonPath("$[0].type") { value("hardcover") }
            }

        verify(bookService).getBooks()
    }

    @Test
    fun `getBookByIsbn returns a matching book`() {
        val book = testBook()
        whenever(bookService.getBookByIsbn("9780134685991")).thenReturn(book)

        mockMvc
            .get("/books/9780134685991") {
                accept = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
                jsonPath("$.id") { value(bookUuid.toString()) }
                jsonPath("$.isbn") { value("9780134685991") }
                jsonPath("$.title") { value("Effective Java") }
                jsonPath("$.author.firstname") { value("Joshua") }
                jsonPath("$.author.lastname") { value("Bloch") }
                jsonPath("$.pages") { value(416) }
                jsonPath("$.publisher.name") { value("Addison-Wesley Professional") }
                jsonPath("$.publisher.address.city") { value("Boston") }
                jsonPath("$.genres[0]") { value("Programming") }
                jsonPath("$.language") { value("English") }
                jsonPath("$.summary") { value("A practical guide to writing robust Java code.") }
                jsonPath("$.publicationDate") { value("2018-01-06") }
                jsonPath("$.edition") { value(3) }
                jsonPath("$.type") { value("hardcover") }
            }

        verify(bookService).getBookByIsbn("9780134685991")
    }

    @Test
    fun `addBook creates a book`() {
        val request = testBook(id = null)
        val created = testBook(id = bookUuid)
        whenever(bookService.addBook(request)).thenReturn(created)

        mockMvc
            .post("/books") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content = testBookJson()
            }.andExpect {
                status { isCreated() }
                jsonPath("$.id") { value(bookUuid.toString()) }
                jsonPath("$.isbn") { value("9780134685991") }
                jsonPath("$.title") { value("Effective Java") }
                jsonPath("$.author.firstname") { value("Joshua") }
                jsonPath("$.author.lastname") { value("Bloch") }
                jsonPath("$.pages") { value(416) }
                jsonPath("$.publisher.name") { value("Addison-Wesley Professional") }
                jsonPath("$.publisher.address.zipCode") { value("02116") }
                jsonPath("$.genres[1]") { value("Java") }
                jsonPath("$.language") { value("English") }
                jsonPath("$.publicationDate") { value("2018-01-06") }
                jsonPath("$.edition") { value(3) }
                jsonPath("$.type") { value("hardcover") }
            }

        verify(bookService).addBook(request)
    }

    @Test
    fun `addBook rejects invalid payload`() {
        mockMvc
            .post("/books") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "isbn": "",
                      "title": "",
                      "author": {
                        "firstname": "",
                        "middlename": "",
                        "lastname": "",
                        "bio": ""
                      },
                      "pages": 0,
                      "publisher": {
                        "name": "",
                        "address": {
                          "street": "",
                          "zipCode": "",
                          "city": ""
                        }
                      },
                      "genres": [],
                      "language": "",
                      "summary": "",
                      "publicationDate": "not-a-date",
                      "edition": 0,
                      "type": "hardcover"
                    }
                    """.trimIndent()
            }.andExpect {
                status { isBadRequest() }
            }

        verify(bookService, never()).addBook(any())
    }

    @Test
    fun `addBook returns conflict for duplicate isbn`() {
        val request = testBook(id = null)
        whenever(bookService.addBook(request)).thenThrow(DuplicateKeyException("duplicate isbn"))

        mockMvc
            .post("/books") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content = testBookJson()
            }.andExpect {
                status { isConflict() }
                jsonPath("$.message") { value("Book with ISBN already exists") }
            }

        verify(bookService).addBook(request)
    }

    @Test
    fun `updateBook updates a book by uuid`() {
        val request = testBook(id = null, title = "Effective Java, 3rd Edition")
        val updated = testBook(id = bookUuid, title = "Effective Java, 3rd Edition")
        whenever(bookService.updateBook(bookUuid, request)).thenReturn(updated)

        mockMvc
            .put("/books/$bookUuid") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content = testBookJson(title = "Effective Java, 3rd Edition")
            }.andExpect {
                status { isOk() }
                jsonPath("$.id") { value(bookUuid.toString()) }
                jsonPath("$.isbn") { value("9780134685991") }
                jsonPath("$.title") { value("Effective Java, 3rd Edition") }
                jsonPath("$.author.firstname") { value("Joshua") }
                jsonPath("$.author.lastname") { value("Bloch") }
                jsonPath("$.pages") { value(416) }
                jsonPath("$.publisher.name") { value("Addison-Wesley Professional") }
                jsonPath("$.language") { value("English") }
                jsonPath("$.publicationDate") { value("2018-01-06") }
                jsonPath("$.edition") { value(3) }
                jsonPath("$.type") { value("hardcover") }
            }

        verify(bookService).updateBook(bookUuid, request)
    }

    @Test
    fun `updateBook rejects invalid uuid`() {
        mockMvc
            .put("/books/not-a-uuid") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content = testBookJson()
            }.andExpect {
                status { isBadRequest() }
            }

        verify(bookService, never()).updateBook(any(), any())
    }

    @Test
    fun `deleteBook removes a book by uuid`() {
        mockMvc
            .delete("/books/$bookUuid")
            .andExpect {
                status { isNoContent() }
            }

        verify(bookService).deleteBook(bookUuid)
    }

    @Test
    fun `book not found returns not found response`() {
        whenever(bookService.getBookByIsbn("missing")).thenThrow(
            BookNotFoundException("Book with ISBN missing was not found"),
        )

        mockMvc
            .get("/books/missing") {
                accept = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isNotFound() }
                jsonPath("$.message") { value("Book with ISBN missing was not found") }
            }

        verify(bookService).getBookByIsbn("missing")
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @Import(BookController::class, BookExceptionHandler::class)
    class TestApplication
}
