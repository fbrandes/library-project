package com.example.bookinfo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class BookinfoApplication

fun main(args: Array<String>) {
    runApplication<BookinfoApplication>(*args)
}
