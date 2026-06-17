package com.example.bookinfo.repository

import org.springframework.data.mongodb.repository.MongoRepository
import java.util.UUID

interface BookRepository : MongoRepository<BookEntity, UUID> {
    fun findByIsbn(isbn: String): BookEntity?
}
