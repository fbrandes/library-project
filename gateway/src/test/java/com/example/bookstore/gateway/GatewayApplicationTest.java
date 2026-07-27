package com.example.bookstore.gateway;

import static org.mockito.Mockito.mockStatic;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

class GatewayApplicationTest {

    @Test
    void mainDelegatesToSpringBoot() {
        String[] args = {"--server.port=0"};

        try (MockedStatic<SpringApplication> springApplication = mockStatic(SpringApplication.class)) {
            GatewayApplication.main(args);

            springApplication.verify(() -> SpringApplication.run(GatewayApplication.class, args));
        }
    }
}
