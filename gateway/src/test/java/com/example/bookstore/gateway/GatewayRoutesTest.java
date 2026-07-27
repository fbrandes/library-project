package com.example.bookstore.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@Import(TestJwtConfiguration.class)
class GatewayRoutesTest {

    private static final MockWebServer BOOKINFO_API = new MockWebServer();
    private static final MockWebServer RENTING_API = new MockWebServer();
    private static final MockWebServer USER_MANAGEMENT_API = new MockWebServer();
    private static final MockWebServer BOOKINFO_UI = new MockWebServer();
    private static final MockWebServer RENTING_UI = new MockWebServer();
    private static final MockWebServer USER_MANAGEMENT_UI = new MockWebServer();
    private static final List<MockWebServer> TARGET_SERVERS = List.of(
            BOOKINFO_API,
            RENTING_API,
            USER_MANAGEMENT_API,
            BOOKINFO_UI,
            RENTING_UI,
            USER_MANAGEMENT_UI);

    static {
        for (MockWebServer server : TARGET_SERVERS) {
            try {
                server.start();
            } catch (IOException exception) {
                throw new ExceptionInInitializerError(exception);
            }
        }
    }

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void gatewayTargets(DynamicPropertyRegistry registry) {
        registry.add("BOOKINFO_API_URI", () -> serverUrl(BOOKINFO_API));
        registry.add("RENTING_API_URI", () -> serverUrl(RENTING_API));
        registry.add("USER_MANAGEMENT_API_URI", () -> serverUrl(USER_MANAGEMENT_API));
        registry.add("BOOKINFO_UI_URI", () -> serverUrl(BOOKINFO_UI));
        registry.add("RENTING_UI_URI", () -> serverUrl(RENTING_UI));
        registry.add("USER_MANAGEMENT_UI_URI", () -> serverUrl(USER_MANAGEMENT_UI));
    }

    @AfterAll
    static void shutdownTargets() throws IOException {
        for (MockWebServer server : TARGET_SERVERS) {
            server.shutdown();
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("routes")
    void routesStripConfiguredPrefixesAndForwardToTargets(RouteCase route) throws InterruptedException {
        route.target.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", route.contentType)
                .setBody(route.responseBody));

        webTestClient.get()
                .uri(route.gatewayPath)
                .header(AUTHORIZATION, "Bearer " + TestJwtConfiguration.VALID_TOKEN)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo(route.responseBody);

        RecordedRequest request = route.target.takeRequest(1, TimeUnit.SECONDS);

        assertThat(request).isNotNull();
        assertThat(request.getMethod()).isEqualTo("GET");
        assertThat(request.getPath()).isEqualTo(route.targetPath);
    }

    private static Stream<RouteCase> routes() {
        return Stream.of(
                new RouteCase(
                        "bookinfo API",
                        BOOKINFO_API,
                        "/api/bookinfo/books?available=true",
                        "/books?available=true",
                        "{\"service\":\"bookinfo\"}",
                        "application/json"),
                new RouteCase(
                        "renting API",
                        RENTING_API,
                        "/api/renting/orders/123",
                        "/orders/123",
                        "{\"service\":\"renting\"}",
                        "application/json"),
                new RouteCase(
                        "user-management API",
                        USER_MANAGEMENT_API,
                        "/api/user-management/users/456",
                        "/users/456",
                        "{\"service\":\"user-management\"}",
                        "application/json"),
                new RouteCase(
                        "bookinfo UI",
                        BOOKINFO_UI,
                        "/bookinfo/assets/index.js",
                        "/assets/index.js",
                        "bookinfo-ui",
                        "text/plain"),
                new RouteCase(
                        "renting UI",
                        RENTING_UI,
                        "/renting/",
                        "/",
                        "renting-ui",
                        "text/plain"),
                new RouteCase(
                        "user-management UI",
                        USER_MANAGEMENT_UI,
                        "/user-management/assets/index.js",
                        "/assets/index.js",
                        "user-management-ui",
                        "text/plain"));
    }

    private static String serverUrl(MockWebServer server) {
        String url = server.url("/").toString();
        return url.substring(0, url.length() - 1);
    }

    private record RouteCase(
            String name,
            MockWebServer target,
            String gatewayPath,
            String targetPath,
            String responseBody,
            String contentType) {

        @Override
        public String toString() {
            return name;
        }
    }
}
