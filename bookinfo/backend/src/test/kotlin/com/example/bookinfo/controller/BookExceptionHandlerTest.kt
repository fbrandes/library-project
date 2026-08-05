package com.example.bookinfo.controller

import com.example.bookinfo.service.BookNotFoundException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class BookExceptionHandlerTest {
  private val exceptionHandler = BookExceptionHandler()

  @Test
  fun `handleBookNotFound returns not found response`() {
    val response =
      exceptionHandler.handleBookNotFound(
        BookNotFoundException("Book with ISBN missing was not found"),
      )

    assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    assertThat(response.body).isEqualTo(
      ErrorResponse(
        status = 404,
        error = "Not Found",
        message = "Book with ISBN missing was not found",
      ),
    )
  }

  @Test
  fun `handleDuplicateKey returns conflict response`() {
    val response = exceptionHandler.handleDuplicateKey()

    assertThat(response.statusCode).isEqualTo(HttpStatus.CONFLICT)
    assertThat(response.body).isEqualTo(
      ErrorResponse(
        status = 409,
        error = "Conflict",
        message = "Book with ISBN already exists",
      ),
    )
  }
}
