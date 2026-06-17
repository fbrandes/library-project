package com.example.bookinfo.mapper

import com.example.bookinfo.api.model.Book
import com.example.bookinfo.repository.BookEntity
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mapstruct.factory.Mappers
import java.util.UUID

class BookMapperTest {
    private val bookMapper = Mappers.getMapper(BookMapper::class.java)
    private val bookUuid = UUID.fromString("550e8400-e29b-41d4-a716-446655440000")

    @Test
    fun `toEntity maps api model to Mongo entity`() {
        val entity = bookMapper.toEntity(book())

        assertThat(entity).isEqualTo(
            BookEntity(
                id = bookUuid,
                isbn = "9780134685991",
                title = "Effective Java",
                author = "Joshua Bloch",
                pages = 416,
            ),
        )
    }

    @Test
    fun `toApi maps Mongo entity to api model`() {
        val apiBook =
            bookMapper.toApi(
                BookEntity(
                    id = bookUuid,
                    isbn = "9780134685991",
                    title = "Effective Java",
                    author = "Joshua Bloch",
                    pages = 416,
                ),
            )

        assertThat(apiBook).isEqualTo(book())
    }

    private fun book() =
        Book(
            id = bookUuid,
            isbn = "9780134685991",
            title = "Effective Java",
            author = "Joshua Bloch",
            pages = 416,
        )
}
