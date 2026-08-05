package com.example.bookinfo.service

class BookNotFoundException(
  message: String,
) : RuntimeException(message)
