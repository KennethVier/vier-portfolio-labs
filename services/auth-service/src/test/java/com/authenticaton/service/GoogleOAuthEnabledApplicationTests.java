package com.authenticaton.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.security.oauth2.client.registration.google.client-id=test-google-client",
        "spring.security.oauth2.client.registration.google.client-secret=test-google-secret",
        "spring.security.oauth2.client.registration.google.scope=email,profile",
        "spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/{registrationId}"
})
@AutoConfigureMockMvc
class GoogleOAuthEnabledApplicationTests {

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void nativeGoogleRegistrationPropertiesEnableAuthorizationEndpoint() throws Exception {
        ClientRegistration google = clientRegistrationRepository.findByRegistrationId("google");

        assertThat(google).isNotNull();
        assertThat(google.getClientId()).isEqualTo("test-google-client");
        assertThat(google.getClientSecret()).isEqualTo("test-google-secret");
        assertThat(google.getScopes()).containsExactlyInAnyOrder("email", "profile");
        assertThat(google.getRedirectUri()).isEqualTo("{baseUrl}/login/oauth2/code/{registrationId}");

        mockMvc.perform(get("/oauth2/authorization/google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("accounts.google.com")));
    }
}
