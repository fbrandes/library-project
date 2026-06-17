package com.example.bookinfo.controller

import com.example.bookinfo.service.BookNotFoundException
import org.springframework.dao.DuplicateKeyException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException

@RestControllerAdvice
class BookExceptionHandler {
    @ExceptionHandler(BookNotFoundException::class)
    fun handleBookNotFound(exception: BookNotFoundException): ResponseEntity<ErrorResponse> =
        errorResponse(HttpStatus.NOT_FOUND, exception.message ?: "Book not found")

    @ExceptionHandler(DuplicateKeyException::class)
    fun handleDuplicateKey(): ResponseEntity<ErrorResponse> = errorResponse(HttpStatus.CONFLICT, "Book with ISBN already exists")

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationFailure(exception: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val fieldError = exception.bindingResult.fieldErrors.firstOrNull()
        val message = fieldError?.let { "${it.field}: ${it.defaultMessage}" } ?: "Invalid request payload"
        return errorResponse(HttpStatus.BAD_REQUEST, message)
    }

    @ExceptionHandler(HttpMessageNotReadableException::class, MethodArgumentTypeMismatchException::class)
    fun handleBadRequest(): ResponseEntity<ErrorResponse> = errorResponse(HttpStatus.BAD_REQUEST, "Invalid request")

    private fun errorResponse(
        status: HttpStatus,
        message: String,
    ): ResponseEntity<ErrorResponse> = ResponseEntity.status(status).body(ErrorResponse(message = message))
}

data class ErrorResponse(
    val message: String,
)
