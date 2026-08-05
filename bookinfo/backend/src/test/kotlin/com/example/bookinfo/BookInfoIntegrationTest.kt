package com.example.bookinfo

import com.example.bookinfo.api.model.Book
import com.example.bookinfo.repository.BookRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.client.RestClient
import org.springframework.web.client.toEntity

@MongoDbIntegrationTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BookInfoIntegrationTest(
  @Autowired private val bookRepository: BookRepository,
) {
  @LocalServerPort
  private var port: Int = 0

  private lateinit var restClient: RestClient

  @BeforeEach
  fun setUp() {
    bookRepository.deleteAll()
    restClient =
      RestClient
        .builder()
        .baseUrl("http://localhost:$port")
        .build()
  }

  @Test
  fun `post book persists it and get book returns it`() {
    val request = testBook()

    val createResponse = createBook(request)

    assertThat(createResponse.statusCode).isEqualTo(HttpStatus.CREATED)
    val created = requireNotNull(createResponse.body)
    assertThat(created.id).isNotNull()
    assertThat(created)
      .usingRecursiveComparison()
      .ignoringFields("id")
      .isEqualTo(request)

    val persisted = bookRepository.findByIsbn(request.isbn)
    assertThat(persisted).isNotNull()
    assertThat(persisted?.id).isEqualTo(created.id)
    assertThat(persisted?.title).isEqualTo(request.title)
    assertThat(persisted?.author).isEqualTo(request.author)
    assertThat(persisted?.pages).isEqualTo(request.pages)
    assertThat(persisted?.publisher).isEqualTo(request.publisher)
    assertThat(persisted?.genres).isEqualTo(request.genres)
    assertThat(persisted?.language).isEqualTo(request.language)
    assertThat(persisted?.summary).isEqualTo(request.summary)
    assertThat(persisted?.publicationDate).isEqualTo(request.publicationDate)
    assertThat(persisted?.edition).isEqualTo(request.edition)
    assertThat(persisted?.type).isEqualTo(request.type)

    val getResponse =
      restClient
        .get()
        .uri("/books/{isbn}", request.isbn)
        .retrieve()
        .toEntity<Book>()

    assertThat(getResponse.statusCode).isEqualTo(HttpStatus.OK)
    assertThat(getResponse.body).isEqualTo(created)
  }

  @Test
  fun `duplicate isbn returns conflict`() {
    val request = testBook()
    createBook(request)

    val duplicateStatus =
      restClient
        .post()
        .uri("/books")
        .contentType(MediaType.APPLICATION_JSON)
        .body(request)
        .exchange { _, response -> response.statusCode }

    assertThat(duplicateStatus).isEqualTo(HttpStatus.CONFLICT)
  }

  private fun createBook(book: Book) =
    restClient
      .post()
      .uri("/books")
      .contentType(MediaType.APPLICATION_JSON)
      .body(book)
      .retrieve()
      .toEntity<Book>()
}
