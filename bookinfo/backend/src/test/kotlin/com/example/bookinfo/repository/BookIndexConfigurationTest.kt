package com.example.bookinfo.repository

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Answers
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.index.Index
import org.springframework.data.mongodb.core.index.IndexOperations
import org.springframework.data.mongodb.core.indexOps

@ExtendWith(MockitoExtension::class)
class BookIndexConfigurationTest {
    @Mock(answer = Answers.RETURNS_MOCKS)
    private lateinit var mongoTemplate: MongoTemplate

    @Mock
    private lateinit var indexOperations: IndexOperations

    @Test
    fun `bookIndexInitializer ensures isbn index`() {
        whenever(mongoTemplate.indexOps<BookDocument>()).thenReturn(indexOperations)

        BookIndexConfiguration()
            .bookIndexInitializer(mongoTemplate)
            .run(DefaultApplicationArguments())

        verify(indexOperations).createIndex(any<Index>())
    }
}
