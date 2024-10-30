package com.jsongnoti.jsongnoti_web.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
@Slf4j
public class GmailSender {

    private final JavaMailSender javaMailSender; // autowire 못하는거 버그인듯
    private final TemplateEngine templateEngine;

    @Value("${action.url}")
    private String actionUrl; // https://jsongnoti.com/

    @Value("${spring.mail.username}")
    private String from;

    /**
     * html 형식으로 메일 전송
     */
    @Async
    public void sendVerifyMail(Long userId, String email, String authenticationToken) {
        Context context = new Context(); // thymeleaf context
        log.info("email = {}, authenticationToken = {}", email, authenticationToken);

        // url/ + /users/{userId}/verify?token={token}
        String verifyEmailActionUrl = actionUrl +
                "/users" +
                "/" + userId +
                "/verify" +
                "?token=" + authenticationToken;

        context.setVariable("headerText", getHeaderText());
        context.setVariable("verifyEmailActionUrl", verifyEmailActionUrl);

        // 보낼 메일 생성
        MimeMessagePreparator preparatory = mimeMessage -> { // callback 이므로 테스트는 메일을 보내거나 따로 떼어서 실행
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");

            helper.setFrom(from);
            helper.setTo(email);
            helper.setSubject(getSubject());

            String content = templateEngine.process("verifyEmail", context);
            helper.setText(content, true);
        };

        // 메일 전송
        try {
            javaMailSender.send(preparatory);
        } catch (Exception e) {
            log.error("메일 전송 실패 e = {}, message = {}", e.getClass().getName(), e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 인증메일 제목
     *
     * @return
     */
    public String getSubject() {
        return "일본 신곡 알림이 인증메일 (" + DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(LocalDateTime.now()) + ")";
    }

    /**
     * 인증 이메일 맨 위에 표시될 텍스트 생성
     *
     * @return
     */
    public String getHeaderText() {
        return "아래의 링크를 클릭하시면 이메일 인증이 완료됩니다. (이 인증은 30분간 유효합니다.)";
    }

    @Async
    public void sendDeleteMail(Long userId, String email, String authenticationToken) {
        Context context = new Context(); // thymeleaf context
        log.info("email = {}, authenticationToken = {}", email, authenticationToken);

        // url/ + /users/{userId}/delete?token={token}
        String verifyEmailActionUrl = actionUrl +
                "/users" +
                "/" + userId +
                "/delete" +
                "?token=" + authenticationToken;

        context.setVariable("headerText", getDeleteHeaderText());
        context.setVariable("deleteEmailActionUrl", verifyEmailActionUrl);

        // 보낼 메일 생성
        MimeMessagePreparator preparatory = mimeMessage -> { // callback 이므로 테스트는 메일을 보내거나 따로 떼어서 실행
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");

            helper.setFrom(from);
            helper.setTo(email);
            helper.setSubject(getDeleteSubject());

            String content = templateEngine.process("deleteEmail", context);
            helper.setText(content, true);
        };

        // 메일 전송
        try {
            javaMailSender.send(preparatory);
        } catch (Exception e) {
            log.error("메일 전송 실패 e = {}, message = {}", e.getClass().getName(), e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 삭제 인증 메일 제목
     *
     * @return
     */
    public String getDeleteSubject() {
        return "일본 신곡 알림이 구독취소 인증메일 (" + DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(LocalDateTime.now()) + ")";
    }

    /**
     * 삭제 인증 이메일 맨 위에 표시될 텍스트 생성
     *
     * @return
     */
    public String getDeleteHeaderText() {
        return "아래의 링크를 클릭하시면 구독취소가 완료됩니다. (이 인증은 5분간 유효합니다.)";
    }

}
