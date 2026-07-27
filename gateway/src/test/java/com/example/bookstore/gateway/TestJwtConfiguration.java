package com.example.bookstore.gateway;

import java.time.Instant;
import java.util.Map;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

import reactor.core.publisher.Mono;

@TestConfiguration(proxyBeanMethods = false)
class TestJwtConfiguration {

    static final String VALID_TOKEN = "valid-token";

    @Bean
    ReactiveJwtDecoder reactiveJwtDecoder() {
        return token -> {
            if (!VALID_TOKEN.equals(token)) {
                return Mono.error(new BadJwtException("Invalid test token"));
            }

            Instant issuedAt = Instant.parse("2026-01-01T00:00:00Z");
            Instant expiresAt = Instant.parse("2030-01-01T00:00:00Z");

            return Mono.just(new Jwt(
                    token,
                    issuedAt,
                    expiresAt,
                    Map.of("alg", "none"),
                    Map.of("sub", "local-user", "scope", "openid profile email")));
        };
    }
}
