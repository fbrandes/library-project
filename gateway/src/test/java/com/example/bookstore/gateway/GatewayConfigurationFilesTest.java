package com.example.bookstore.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class GatewayConfigurationFilesTest {

    @Test
    void dockerComposeDefinesLocalGatewayOauthAndKeycloakServices() throws IOException {
        String compose = Files.readString(Path.of("docker-compose.yml"));

        assertThat(compose)
                .contains("gateway:")
                .contains("oauth2-proxy:")
                .contains("keycloak:")
                .contains("GATEWAY_OAUTH2_ISSUER_URI: http://keycloak:8080/realms/library")
                .contains("BOOKINFO_API_URI: http://bookinfo:8080")
                .contains("RENTING_API_URI: http://renting:8080")
                .contains("USER_MANAGEMENT_API_URI: http://user-management:8080")
                .contains("\"8080:8080\"")
                .contains("\"4180:4180\"")
                .contains("\"8090:8080\"");
    }

    @Test
    void oauth2ProxyUsesKeycloakRealmAndPassesBearerTokenToGateway() throws IOException {
        String config = Files.readString(Path.of("oauth2-proxy/oauth2-proxy.cfg"));

        assertThat(config)
                .contains("provider = \"keycloak-oidc\"")
                .contains("oidc_issuer_url = \"http://keycloak:8080/realms/library\"")
                .contains("client_id = \"oauth2-proxy\"")
                .contains("client_secret = \"local-secret\"")
                .contains("redirect_url = \"http://localhost:4180/oauth2/callback\"")
                .contains("set_authorization_header = true")
                .contains("pass_access_token = true")
                .contains("upstreams = [\"http://gateway:8080\"]");
    }

    @Test
    void keycloakRealmDefinesGatewayValidationClientOauthProxyClientAndLocalUser() throws IOException {
        String realm = Files.readString(Path.of("keycloak/library-realm.json"));

        assertThat(realm)
                .contains("\"realm\": \"library\"")
                .contains("\"clientId\": \"gateway-resource-server\"")
                .contains("\"bearerOnly\": true")
                .contains("\"clientId\": \"oauth2-proxy\"")
                .contains("\"secret\": \"local-secret\"")
                .contains("\"http://localhost:4180/oauth2/callback\"")
                .contains("\"username\": \"local-user\"")
                .contains("\"value\": \"local-password\"");
    }
}
