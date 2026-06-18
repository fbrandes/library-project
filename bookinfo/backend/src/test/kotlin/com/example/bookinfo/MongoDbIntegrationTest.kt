package com.example.bookinfo

import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.util.TestPropertyValues
import org.springframework.context.ApplicationContextInitializer
import org.springframework.context.ConfigurableApplicationContext
import org.springframework.core.annotation.AliasFor
import org.springframework.test.context.ContextConfiguration
import org.testcontainers.containers.MongoDBContainer
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName
import kotlin.reflect.KClass

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@SpringBootTest
@ContextConfiguration(initializers = [MongoContainerInitializer::class])
@Testcontainers(disabledWithoutDocker = true)
annotation class MongoDbIntegrationTest(
    @get:AliasFor(annotation = SpringBootTest::class, attribute = "properties")
    val properties: Array<String> = [],
    @get:AliasFor(annotation = SpringBootTest::class, attribute = "classes")
    val classes: Array<KClass<*>> = [],
    @get:AliasFor(annotation = SpringBootTest::class, attribute = "webEnvironment")
    val webEnvironment: SpringBootTest.WebEnvironment = SpringBootTest.WebEnvironment.MOCK,
)

class MongoContainerInitializer : ApplicationContextInitializer<ConfigurableApplicationContext> {
    private val mongodb = MongoDBContainer(DockerImageName.parse("mongo:8.2"))

    override fun initialize(applicationContext: ConfigurableApplicationContext) {
        mongodb.start()

        TestPropertyValues
            .of(
                "spring.mongodb.uri=${mongodb.replicaSetUrl}",
                "spring.mongodb.database=bookinfo",
            ).applyTo(applicationContext.environment)
    }
}
