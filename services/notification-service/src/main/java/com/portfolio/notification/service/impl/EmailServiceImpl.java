package com.portfolio.notification.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.portfolio.notification.service.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${platform.notifications.email-enabled:false}")
    private boolean emailEnabled;

    @Value("${platform.notifications.from-address:no-reply@portfolio.local}")
    private String fromAddress;

    @Override
    public void sendEmail(String to, String subject, String text) {
        if (!emailEnabled) {
            log.info("Email disabled. Would send to={} subject={} body={}", to, subject, text);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }
}
