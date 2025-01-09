package com.jsongnoti.jsongnoti_web.mail;

import lombok.Getter;
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
     * 신곡알림 구독 인증 메일 전송
     */
    @Async
    public void sendVerifyMail(String email, String authenticationToken, VerifyMailType verifyMailType) {
        Context context = new Context(); // thymeleaf context
        log.info("email = {}, authenticationToken = {}", email, authenticationToken);

        context.setVariable("headerText", verifyMailType.headerText);
        context.setVariable("authenticationToken", authenticationToken);
        context.setVariable("footerText", verifyMailType.footerText);
        context.setVariable("timestamp", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(LocalDateTime.now()));

        // 보낼 메일 생성
        MimeMessagePreparator preparatory = mimeMessage -> { // callback 이므로 테스트는 메일을 보내거나 따로 떼어서 실행
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(from, "제이노티");
            helper.setTo(email);
            helper.setSubject(verifyMailType.getSubjectWithTime());

            String content = templateEngine.process("verify-email", context);
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


    @Getter
    public enum VerifyMailType {
        SUBSCRIBE(
                "제이노티 신곡알림 구독 인증메일",
                "제이노티 신곡알림 구독 인증메일 입니다. 인증번호를 입력하시면 구독이 완료됩니다. (인증코드는 5분간 유효합니다)",
                "인증메일이 스팸으로 분류되었을 경우, 스팸해제 해주셔야 알림메일을 정상적으로 수신할 수 있습니다."
        ),
        UNSUBSCRIBE(
                "제이노티 신곡알림 구독취소 인증메일",
                "제이노티 신곡알림 구독취소 인증메일 입니다. 인증번호를 입력하시면 구독이 취소됩니다. (인증코드는 5분간 유효합니다)",
                ""
        ),
        DELETE_USER(
                "제이노티 회원 탈퇴 인증메일",
                "제이노티 회원 탈퇴 인증메일 입니다. 인증번호를 입력하시면 회원 탈퇴가 완료됩니다. (인증코드는 5분간 유효합니다)",
                "회원 탈퇴시에는 모든 애창곡 정보가 삭제됩니다. '신곡알림' 서비스의 구독은 영향을 받지 않습니다."
        );

        final String subject;
        final String headerText;
        final String footerText;

        VerifyMailType(String subject, String headerText, String footerText) {
            this.subject = subject;
            this.headerText = headerText;
            this.footerText = footerText;
        }

        String getSubjectWithTime() {
            return subject + " (" + DateTimeFormatter.ofPattern("HH:mm").format(LocalDateTime.now()) + ")";
        }
    }

}
