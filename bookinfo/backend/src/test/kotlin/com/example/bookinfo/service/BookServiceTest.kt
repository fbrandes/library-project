package com.example.bookinfo.service

import com.example.bookinfo.mapper.BookMapper
import com.example.bookinfo.repository.BookDocument
import com.example.bookinfo.repository.BookRepository
import com.example.bookinfo.testBook
import com.example.bookinfo.testBookEntity
import com.example.bookinfo.testBookUuid
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class BookServiceTest {
  @Mock
  private lateinit var bookRepository: BookRepository

  @Mock
  private lateinit var bookMapper: BookMapper

  @InjectMocks
  private lateinit var bookService: BookService

  private val bookUuid = testBookUuid
  private val clientSuppliedUuid = UUID.fromString("11111111-1111-4111-8111-111111111111")
  private val missingUuid = UUID.fromString("22222222-2222-4222-8222-222222222222")

  @Test
  fun `getBooks returns mapped books`() {
    val entity = testBookEntity()
    val apiBook = testBook()
    whenever(bookRepository.findAll()).thenReturn(listOf(entity))
    whenever(bookMapper.toApi(entity)).thenReturn(apiBook)

    val books = bookService.getBooks()

    assertThat(books).containsExactly(apiBook)
    verify(bookRepository).findAll()
    verify(bookMapper).toApi(entity)
  }

  @Test
  fun `getBookByIsbn returns mapped book when found`() {
    val entity = testBookEntity()
    val apiBook = testBook()
    whenever(bookRepository.findByIsbn("9780134685991")).thenReturn(entity)
    whenever(bookMapper.toApi(entity)).thenReturn(apiBook)

    val result = bookService.getBookByIsbn("9780134685991")

    assertThat(result).isEqualTo(apiBook)
    verify(bookRepository).findByIsbn("9780134685991")
    verify(bookMapper).toApi(entity)
  }

  @Test
  fun `getBookByIsbn throws when book does not exist`() {
    whenever(bookRepository.findByIsbn("missing")).thenReturn(null)

    val exception =
      assertThrows(BookNotFoundException::class.java) {
        bookService.getBookByIsbn("missing")
      }

    assertThat(exception.message).isEqualTo("Book with ISBN missing was not found")
    verify(bookRepository).findByIsbn("missing")
    verify(bookMapper, never()).toApi(any())
  }

  @Test
  fun `addBook saves mapped book with generated uuid`() {
    val request = testBook(id = clientSuppliedUuid)
    val mappedEntity = testBookEntity(id = clientSuppliedUuid)
    val savedEntity = testBookEntity(id = bookUuid)
    val response = testBook(id = bookUuid)
    whenever(bookMapper.toEntity(request)).thenReturn(mappedEntity)
    whenever(bookRepository.save(any<BookDocument>())).thenReturn(savedEntity)
    whenever(bookMapper.toApi(savedEntity)).thenReturn(response)

    val created = bookService.addBook(request)

    assertThat(created).isEqualTo(response)
    val savedEntityCaptor = argumentCaptor<BookDocument>()
    verify(bookMapper).toEntity(request)
    verify(bookRepository).save(savedEntityCaptor.capture())
    assertThat(savedEntityCaptor.firstValue.id).isNotNull().isNotEqualTo(clientSuppliedUuid)
    assertThat(savedEntityCaptor.firstValue)
      .usingRecursiveComparison()
      .ignoringFields("id")
      .isEqualTo(mappedEntity)
    verify(bookMapper).toApi(savedEntity)
  }

  @Test
  fun `updateBook saves mapped book with path uuid`() {
    val request = testBook(id = clientSuppliedUuid)
    val mappedEntity = testBookEntity(id = clientSuppliedUuid)
    val savedEntity = testBookEntity(id = bookUuid, title = "Effective Java, 3rd Edition")
    val response = testBook(id = bookUuid, title = "Effective Java, 3rd Edition")
    whenever(bookRepository.existsById(bookUuid)).thenReturn(true)
    whenever(bookMapper.toEntity(request)).thenReturn(mappedEntity)
    whenever(bookRepository.save(mappedEntity.copy(id = bookUuid))).thenReturn(savedEntity)
    whenever(bookMapper.toApi(savedEntity)).thenReturn(response)

    val updated = bookService.updateBook(bookUuid, request)

    assertThat(updated).isEqualTo(response)
    verify(bookRepository).existsById(bookUuid)
    verify(bookMapper).toEntity(request)
    verify(bookRepository).save(mappedEntity.copy(id = bookUuid))
    verify(bookMapper).toApi(savedEntity)
  }

  @Test
  fun `updateBook throws when book does not exist`() {
    val request = testBook(id = clientSuppliedUuid)
    whenever(bookRepository.existsById(missingUuid)).thenReturn(false)

    val exception =
      assertThrows(BookNotFoundException::class.java) {
        bookService.updateBook(missingUuid, request)
      }

    assertThat(exception.message).isEqualTo("Book with UUID $missingUuid was not found")
    verify(bookRepository).existsById(missingUuid)
    verify(bookMapper, never()).toEntity(any())
    verify(bookRepository, never()).save(any())
  }

  @Test
  fun `deleteBook deletes existing book`() {
    whenever(bookRepository.existsById(bookUuid)).thenReturn(true)

    bookService.deleteBook(bookUuid)

    verify(bookRepository).existsById(bookUuid)
    verify(bookRepository).deleteById(bookUuid)
  }

  @Test
  fun `deleteBook throws when book does not exist`() {
    whenever(bookRepository.existsById(missingUuid)).thenReturn(false)

    val exception =
      assertThrows(BookNotFoundException::class.java) {
        bookService.deleteBook(missingUuid)
      }

    assertThat(exception.message).isEqualTo("Book with UUID $missingUuid was not found")
    verify(bookRepository).existsById(missingUuid)
    verify(bookRepository, never()).deleteById(any())
  }
}
