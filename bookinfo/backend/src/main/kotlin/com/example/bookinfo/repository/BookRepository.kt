package com.example.bookinfo.repository

import org.springframework.data.mongodb.repository.MongoRepository
import java.util.UUID

interface BookRepository : MongoRepository<BookDocument, UUID> {
    fun findByIsbn(isbn: String): BookDocument?
}
