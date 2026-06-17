package com.example.bookinfo

import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@MongoDbIntegrationTest(
    properties = [
        "management.health.mongodb.enabled=false",
    ],
)
@DisplayName("Actuator Endpoints")
@AutoConfigureMockMvc
class ActuatorEndpointTest(
    @Autowired private val mockMvc: MockMvc,
) {
    @ParameterizedTest(name = "{0} endpoint is up")
    @ValueSource(strings = ["/health", "/info"])
    fun actuatorEndpointAreAvailable(endpoint: String) {
        mockMvc
            .get(endpoint) {}
            .andExpect {
                status { isOk() }
            }
    }
}
