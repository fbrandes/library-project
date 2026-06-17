package com.example.bookinfo.repository

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.UUID

@Document(collection = "books")
data class BookEntity(
    @Id
    val id: UUID? = null,
    val isbn: String,
    val title: String,
    val author: String,
    val pages: Int,
)
