package com.example.bookinfo.mapper

import com.example.bookinfo.testBook
import com.example.bookinfo.testBookEntity
import com.example.bookinfo.testBookUuid
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mapstruct.factory.Mappers

class BookMapperTest {
    private val bookMapper = Mappers.getMapper(BookMapper::class.java)
    private val bookUuid = testBookUuid

    @Test
    fun `toEntity maps api model to Mongo entity`() {
        val entity = bookMapper.toEntity(testBook())

        assertThat(entity).isEqualTo(
            testBookEntity(id = bookUuid),
        )
    }

    @Test
    fun `toApi maps Mongo entity to api model`() {
        val apiBook =
            bookMapper.toApi(
                testBookEntity(id = bookUuid),
            )

        assertThat(apiBook).isEqualTo(testBook())
    }
}
