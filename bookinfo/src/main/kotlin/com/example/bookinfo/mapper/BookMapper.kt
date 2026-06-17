package com.example.bookinfo.mapper

import com.example.bookinfo.api.model.Book
import com.example.bookinfo.repository.BookEntity
import org.mapstruct.Mapper
import org.mapstruct.MappingConstants

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface BookMapper {
    fun toEntity(book: Book): BookEntity

    fun toApi(entity: BookEntity): Book
}
