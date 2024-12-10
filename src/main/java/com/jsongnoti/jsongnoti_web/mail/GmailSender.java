package com.jsongnoti.jsongnoti_web.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.scheduling.annotation.Async;
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
    public void sendVerifyMail(String email, String authenticationToken) {
        Context context = new Context(); // thymeleaf context
        log.info("email = {}, authenticationToken = {}", email, authenticationToken);

        context.setVariable("headerText", getHeaderText());
        context.setVariable("authenticationToken", authenticationToken);
        context.setVariable("footerText", getFooterText());
        context.setVariable("timestamp", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(LocalDateTime.now()));

        // 보낼 메일 생성
        MimeMessagePreparator preparatory = mimeMessage -> { // callback 이므로 테스트는 메일을 보내거나 따로 떼어서 실행
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(from, "신곡 알림이");
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
        return "일본 신곡 알림이 인증메일 (" + DateTimeFormatter.ofPattern("HH:mm").format(LocalDateTime.now()) + ")";
    }

    /**
     * 인증 이메일 맨 위에 표시될 텍스트 생성
     *
     * @return
     */
    public String getHeaderText() {
        return "일본 신곡 알림이 구독 인증 메일 입니다. 인증번호를 입력하시면 구독이 완료됩니다. (인증코드는 5분간 유효합니다)" ;
    }

    public String getFooterText() {
        return "인증메일이 스팸으로 분류되었을 경우, 스팸해제 해주셔야 알림메일을 정상적으로 수신할 수 있습니다.";
    }


    // 삭제 인증 메일 전송 =================================================================================================

    @Async
    public void sendDeleteMail(String email, String authenticationToken) {
        Context context = new Context(); // thymeleaf context
        log.info("email = {}, authenticationToken = {}", email, authenticationToken);

        context.setVariable("headerText", getDeleteHeaderText(email));
        context.setVariable("authenticationToken", authenticationToken);
        context.setVariable("timestamp", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(LocalDateTime.now()));

        // 보낼 메일 생성
        MimeMessagePreparator preparatory = mimeMessage -> { // callback 이므로 테스트는 메일을 보내거나 따로 떼어서 실행
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");

            helper.setFrom(from, "신곡 알림이");
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
        return "일본 신곡 알림이 구독취소 인증메일 (" + DateTimeFormatter.ofPattern("HH:mm").format(LocalDateTime.now()) + ")";
    }

    /**
     * 삭제 인증 이메일 맨 위에 표시될 텍스트 생성
     *
     * @return
     */
    public String getDeleteHeaderText(String email) {
        return "일본 신곡 알림이 구독취소 인증메일 입니다. 인증번호를 입력하시면 구독이 취소됩니다. (인증코드는 5분간 유효합니다)";
    }

}
