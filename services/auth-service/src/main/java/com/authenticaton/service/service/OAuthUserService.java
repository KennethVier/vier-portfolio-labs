package com.authenticaton.service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.authenticaton.service.entity.User;
import com.authenticaton.service.enums.AuthProvider;
import com.authenticaton.service.enums.Role;
import com.authenticaton.service.exception.InvalidRequestException;
import com.authenticaton.service.repository.UserRepository;

@Service
public class OAuthUserService {

    @Autowired
    UserRepository userRepository;

    public User processOAuth2User(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name  = oAuth2User.getAttribute("name");

        if (email == null) {
            throw new InvalidRequestException("Email not found from OAuth provider");
        }

        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setUsername(name != null ? name : email);
                    newUser.setProvider(AuthProvider.GOOGLE);
                    newUser.setRole(Role.USER);
                    newUser.setPassword(null);
                    return userRepository.save(newUser);
                });
    }

}
