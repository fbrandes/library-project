package com.example.bookinfo.controller

import com.example.bookinfo.api.model.Book
import com.example.bookinfo.service.BookNotFoundException
import com.example.bookinfo.service.BookService
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
import java.util.UUID

@SpringBootTest(classes = [BookControllerTest.TestApplication::class])
@AutoConfigureMockMvc
class BookControllerTest(
    @Autowired private val mockMvc: MockMvc,
) {
    @MockitoBean
    private lateinit var bookService: BookService

    private val bookUuid = UUID.fromString("550e8400-e29b-41d4-a716-446655440000")

    @Test
    fun `getBooks returns all books`() {
        val books = listOf(book())
        whenever(bookService.getBooks()).thenReturn(books)

        mockMvc
            .get("/books") {
                accept = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].id") { value(bookUuid.toString()) }
                jsonPath("$[0].isbn") { value("9780134685991") }
                jsonPath("$[0].title") { value("Effective Java") }
                jsonPath("$[0].author") { value("Joshua Bloch") }
                jsonPath("$[0].pages") { value(416) }
            }

        verify(bookService).getBooks()
    }

    @Test
    fun `getBookByIsbn returns a matching book`() {
        val book = book()
        whenever(bookService.getBookByIsbn("9780134685991")).thenReturn(book)

        mockMvc
            .get("/books/9780134685991") {
                accept = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
                jsonPath("$.id") { value(bookUuid.toString()) }
                jsonPath("$.isbn") { value("9780134685991") }
                jsonPath("$.title") { value("Effective Java") }
                jsonPath("$.author") { value("Joshua Bloch") }
                jsonPath("$.pages") { value(416) }
            }

        verify(bookService).getBookByIsbn("9780134685991")
    }

    @Test
    fun `addBook creates a book`() {
        val request = book(id = null)
        val created = book(id = bookUuid)
        whenever(bookService.addBook(request)).thenReturn(created)

        mockMvc
            .post("/books") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "isbn": "9780134685991",
                      "title": "Effective Java",
                      "author": "Joshua Bloch",
                      "pages": 416
                    }
                    """.trimIndent()
            }.andExpect {
                status { isCreated() }
                jsonPath("$.id") { value(bookUuid.toString()) }
                jsonPath("$.isbn") { value("9780134685991") }
                jsonPath("$.title") { value("Effective Java") }
                jsonPath("$.author") { value("Joshua Bloch") }
                jsonPath("$.pages") { value(416) }
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
                      "author": "Joshua Bloch",
                      "pages": 0
                    }
                    """.trimIndent()
            }.andExpect {
                status { isBadRequest() }
            }

        verify(bookService, never()).addBook(any())
    }

    @Test
    fun `addBook returns conflict for duplicate isbn`() {
        val request = book(id = null)
        whenever(bookService.addBook(request)).thenThrow(DuplicateKeyException("duplicate isbn"))

        mockMvc
            .post("/books") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "isbn": "9780134685991",
                      "title": "Effective Java",
                      "author": "Joshua Bloch",
                      "pages": 416
                    }
                    """.trimIndent()
            }.andExpect {
                status { isConflict() }
                jsonPath("$.message") { value("Book with ISBN already exists") }
            }

        verify(bookService).addBook(request)
    }

    @Test
    fun `updateBook updates a book by uuid`() {
        val request = book(id = null, title = "Effective Java, 3rd Edition")
        val updated = book(id = bookUuid, title = "Effective Java, 3rd Edition")
        whenever(bookService.updateBook(bookUuid, request)).thenReturn(updated)

        mockMvc
            .put("/books/$bookUuid") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "isbn": "9780134685991",
                      "title": "Effective Java, 3rd Edition",
                      "author": "Joshua Bloch",
                      "pages": 416
                    }
                    """.trimIndent()
            }.andExpect {
                status { isOk() }
                jsonPath("$.id") { value(bookUuid.toString()) }
                jsonPath("$.isbn") { value("9780134685991") }
                jsonPath("$.title") { value("Effective Java, 3rd Edition") }
                jsonPath("$.author") { value("Joshua Bloch") }
                jsonPath("$.pages") { value(416) }
            }

        verify(bookService).updateBook(bookUuid, request)
    }

    @Test
    fun `updateBook rejects invalid uuid`() {
        mockMvc
            .put("/books/not-a-uuid") {
                contentType = MediaType.APPLICATION_JSON
                accept = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "isbn": "9780134685991",
                      "title": "Effective Java",
                      "author": "Joshua Bloch",
                      "pages": 416
                    }
                    """.trimIndent()
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

    private fun book(
        id: UUID? = bookUuid,
        title: String = "Effective Java",
    ) = Book(
        id = id,
        isbn = "9780134685991",
        title = title,
        author = "Joshua Bloch",
        pages = 416,
    )

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @Import(BookController::class, BookExceptionHandler::class)
    class TestApplication
}
