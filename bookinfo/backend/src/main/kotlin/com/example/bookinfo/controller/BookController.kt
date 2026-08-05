package com.example.bookinfo.controller

import com.example.bookinfo.api.model.Book
import com.example.bookinfo.service.BookService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/books")
class BookController(
  private val bookService: BookService,
) {
  @GetMapping
  fun getBooks(): ResponseEntity<List<Book>> = ResponseEntity.ok(bookService.getBooks())

  @GetMapping("/{identifier}")
  fun getBookByIsbn(
    @PathVariable("identifier") isbn: String,
  ): ResponseEntity<Book> = ResponseEntity.ok(bookService.getBookByIsbn(isbn))

  @PostMapping
  fun addBook(
    @Valid @RequestBody book: Book,
  ): ResponseEntity<Book> = ResponseEntity.status(HttpStatus.CREATED).body(bookService.addBook(book))

  @PutMapping("/{identifier}")
  fun updateBook(
    @PathVariable("identifier") uuid: UUID,
    @Valid @RequestBody book: Book,
  ): ResponseEntity<Book> = ResponseEntity.ok(bookService.updateBook(uuid, book))

  @DeleteMapping("/{identifier}")
  fun deleteBook(
    @PathVariable("identifier") uuid: UUID,
  ): ResponseEntity<Void> {
    bookService.deleteBook(uuid)
    return ResponseEntity.noContent().build()
  }
}
