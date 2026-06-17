package com.example.bookinfo.service

import com.example.bookinfo.api.model.Book
import com.example.bookinfo.mapper.BookMapper
import com.example.bookinfo.repository.BookRepository
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class BookService(
    private val bookRepository: BookRepository,
    private val bookMapper: BookMapper,
) {
    fun getBooks(): List<Book> = bookRepository.findAll().map(bookMapper::toApi)

    fun getBookByIsbn(isbn: String): Book =
        bookRepository
            .findByIsbn(isbn)
            ?.let(bookMapper::toApi)
            ?: throw BookNotFoundException("Book with ISBN $isbn was not found")

    fun addBook(book: Book): Book {
        val entity = bookMapper.toEntity(book).copy(id = UUID.randomUUID())
        return bookMapper.toApi(bookRepository.save(entity))
    }

    fun updateBook(
        uuid: UUID,
        book: Book,
    ): Book {
        if (!bookRepository.existsById(uuid)) {
            throw BookNotFoundException("Book with UUID $uuid was not found")
        }

        val entity = bookMapper.toEntity(book).copy(id = uuid)
        return bookMapper.toApi(bookRepository.save(entity))
    }

    fun deleteBook(uuid: UUID) {
        if (!bookRepository.existsById(uuid)) {
            throw BookNotFoundException("Book with UUID $uuid was not found")
        }

        bookRepository.deleteById(uuid)
    }
}
