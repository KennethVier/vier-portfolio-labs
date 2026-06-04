package com.authenticaton.service.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.authenticaton.service.entity.User;
import com.authenticaton.service.service.JwtService;
import com.authenticaton.service.service.OAuthUserService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuthLoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler  {

    @Autowired
    JwtService jwtService;

    @Autowired
    OAuthUserService oAuthUserService;

    @Value("${platform.oauth2.success-redirect-url:http://localhost:5173/auth/oauth2/success}")
    String oauthSuccessRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuthUser = (OAuth2User) authentication.getPrincipal();
        User user = oAuthUserService.processOAuth2User(oAuthUser);

        String token = jwtService.generateToken(user);

        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);

        String redirectUrl = oauthSuccessRedirectUrl + "?token=" + encodedToken + "&email=" + 
                             URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) + 
                             "&username=" + URLEncoder.encode(user.getUsername(), StandardCharsets.UTF_8);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

}

