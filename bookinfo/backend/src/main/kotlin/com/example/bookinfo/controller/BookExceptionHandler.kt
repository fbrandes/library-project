package com.example.bookinfo.controller

import com.example.bookinfo.service.BookNotFoundException
import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.dao.DuplicateKeyException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import tools.jackson.core.JacksonException
import tools.jackson.core.exc.StreamReadException
import tools.jackson.databind.exc.InvalidFormatException
import tools.jackson.databind.exc.MismatchedInputException
import tools.jackson.module.kotlin.KotlinInvalidNullException

@RestControllerAdvice
class BookExceptionHandler {
    @ExceptionHandler(BookNotFoundException::class)
    fun handleBookNotFound(exception: BookNotFoundException): ResponseEntity<ErrorResponse> =
        errorResponse(HttpStatus.NOT_FOUND, exception.message ?: "Book not found")

    @ExceptionHandler(DuplicateKeyException::class)
    fun handleDuplicateKey(): ResponseEntity<ErrorResponse> = errorResponse(HttpStatus.CONFLICT, "Book with ISBN already exists")

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationFailure(exception: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val details =
            exception.bindingResult.fieldErrors.map {
                ErrorDetail(field = it.field, message = it.defaultMessage ?: "Invalid value")
            } +
                exception.bindingResult.globalErrors.map {
                    ErrorDetail(field = it.objectName, message = it.defaultMessage ?: "Invalid value")
                }

        return errorResponse(HttpStatus.BAD_REQUEST, "Request validation failed", details)
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadableMessage(exception: HttpMessageNotReadableException): ResponseEntity<ErrorResponse> =
        errorResponse(
            HttpStatus.BAD_REQUEST,
            "Request body could not be parsed",
            exception.toErrorDetails(),
        )

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(exception: MethodArgumentTypeMismatchException): ResponseEntity<ErrorResponse> {
        val value = exception.value?.toString() ?: "null"
        val details =
            listOf(
                ErrorDetail(
                    field = exception.name,
                    message = "Invalid value '$value'. Expected ${expectedType(exception.requiredType)}",
                ),
            )

        return errorResponse(HttpStatus.BAD_REQUEST, "Request parameter validation failed", details)
    }

    private fun errorResponse(
        status: HttpStatus,
        message: String,
        details: List<ErrorDetail> = emptyList(),
    ): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(status).body(
            ErrorResponse(
                status = status.value(),
                error = status.reasonPhrase,
                message = message,
                details = details,
            ),
        )

    private fun HttpMessageNotReadableException.toErrorDetails(): List<ErrorDetail> {
        findCause<InvalidFormatException>()?.let { return listOf(it.toErrorDetail()) }
        findCause<KotlinInvalidNullException>()?.let {
            return listOf(
                ErrorDetail(
                    field = it.fieldPath() ?: it.kotlinPropertyName,
                    message = "Missing required field",
                ),
            )
        }
        findCause<MismatchedInputException>()?.let {
            return listOf(
                ErrorDetail(
                    field = it.fieldPath(),
                    message = "Invalid JSON value. Expected ${expectedType(it.targetType)}",
                ),
            )
        }
        findCause<StreamReadException>()?.let {
            return listOf(ErrorDetail(message = "Malformed JSON: ${it.originalMessage}"))
        }

        return listOf(ErrorDetail(message = "Request body is malformed or contains unsupported values"))
    }

    private fun InvalidFormatException.toErrorDetail(): ErrorDetail {
        val value = value?.toString() ?: "null"
        val message =
            when {
                targetType?.isEnum == true ->
                    "Invalid value '$value'. Expected one of: ${targetType.enumConstants.joinToString(", ")}"
                targetType == java.time.LocalDate::class.java ->
                    "Invalid date '$value'. Expected format yyyy-MM-dd"
                else ->
                    "Invalid value '$value'. Expected ${expectedType(targetType)}"
            }

        return ErrorDetail(field = fieldPath(), message = message)
    }

    private fun JacksonException.fieldPath(): String? {
        val fieldPath =
            path
                .mapNotNull { reference ->
                    reference.propertyName ?: reference.index.takeIf { it >= 0 }?.let { "[$it]" }
                }.joinToString(".")
                .replace(".[", "[")

        return fieldPath.ifBlank { null }
    }

    private fun expectedType(type: Class<*>?): String =
        when (type) {
            null -> "the expected type"
            String::class.java -> "string"
            Int::class.java,
            Int::class.javaObjectType,
            Long::class.java,
            Long::class.javaObjectType,
            Double::class.java,
            Double::class.javaObjectType,
            Float::class.java,
            Float::class.javaObjectType,
            -> "number"
            Boolean::class.java,
            Boolean::class.javaObjectType,
            -> "boolean"
            java.time.LocalDate::class.java -> "date in format yyyy-MM-dd"
            else -> type.simpleName
        }

    private inline fun <reified T : Throwable> Throwable.findCause(): T? {
        var current: Throwable? = this

        while (current != null) {
            if (current is T) {
                return current
            }

            current = current.cause
        }

        return null
    }
}

@JsonInclude(JsonInclude.Include.NON_EMPTY)
data class ErrorResponse(
    val status: Int,
    val error: String,
    val message: String,
    val details: List<ErrorDetail> = emptyList(),
)

@JsonInclude(JsonInclude.Include.NON_EMPTY)
data class ErrorDetail(
    val field: String? = null,
    val message: String,
)
