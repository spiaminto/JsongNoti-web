package com.jsongnoti.jsongnoti_web.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import static lombok.AccessLevel.PROTECTED;

@Entity
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PROTECTED)
@Builder
@Getter
@EqualsAndHashCode
@ToString
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private boolean verified;   // 이메일 인증 여부

    @CreationTimestamp
    private LocalDateTime createdAt;

    // 이메일 인증 및 탈퇴 인증 시 사용
    private String authenticationToken;
    private LocalDateTime authenticationTimestamp;
    private int authenticationRetry; // 최대 3

    /**
     * User 의 이메일 인증을 완료합니다.<br>
     * 인증이 완료되면 authenticationToken, authenticationTimestamp 를 null 로 초기화하고 verified 를 true 로 설정합니다.
     */
    public void verify() {
        this.authenticationToken = null;
        this.authenticationTimestamp = null;
        this.verified = true;
    }

    /**
     * User 의 인증 토큰과 인증토큰 만료시간, 재시도 횟수를 갱신합니다.
     */
    public void setAuth() {
        String authenticationToken = new SecureRandom().nextInt(1000, 10000) + "";
        LocalDateTime authenticationTimestamp = LocalDateTime.now();
        this.authenticationToken = authenticationToken;
        this.authenticationTimestamp = authenticationTimestamp;
        this.authenticationRetry = 0;
    }

    /**
     * User 가 인증에 실패하여 재시도 횟수를 증가시킵니다.
     */
    public void verificationFailed() {
        this.authenticationRetry++;
    }
}
