package com.example.bookinfo.repository

import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.Sort
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.index.Index
import org.springframework.data.mongodb.core.indexOps

@Configuration
class BookIndexConfiguration {
    @Bean
    fun bookIndexInitializer(mongoTemplate: MongoTemplate) =
        ApplicationRunner {
            mongoTemplate
                .indexOps<BookEntity>()
                .createIndex(Index().on(BookEntity::isbn.name, Sort.Direction.ASC).unique())
        }
}
