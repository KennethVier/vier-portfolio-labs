package com.authenticaton.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ServiceApplicationTests {
	@Autowired
	private ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider;

	@Test
	void contextLoadsWithoutGoogleOAuthConfiguration() {
		assertThat(clientRegistrationRepositoryProvider.getIfAvailable()).isNull();
	}

}
