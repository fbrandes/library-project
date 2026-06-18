package com.example.bookinfo.mapper

import com.example.bookinfo.api.model.Book
import com.example.bookinfo.repository.BookDocument
import org.mapstruct.Mapper
import org.mapstruct.MappingConstants

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface BookMapper {
    fun toEntity(book: Book): BookDocument

    fun toApi(entity: BookDocument): Book
}
