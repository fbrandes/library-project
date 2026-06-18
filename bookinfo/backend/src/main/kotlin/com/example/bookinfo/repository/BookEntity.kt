package com.example.bookinfo.repository

import com.example.bookinfo.api.model.Author
import com.example.bookinfo.api.model.BookType
import com.example.bookinfo.api.model.Publisher
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.LocalDate
import java.util.UUID

@Document(collection = "books")
data class BookEntity(
    @Id
    val id: UUID? = null,
    val isbn: String,
    val title: String,
    val author: Author,
    val pages: Int,
    val publisher: Publisher,
    val genres: List<String>,
    val language: String,
    val summary: String,
    val publicationDate: LocalDate,
    val edition: Int,
    val type: BookType,
)
