package com.jsongnoti.jsongnoti_web.domain;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.FavoriteSongPresentType;
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
public class Member {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String username; // email 에서 @ 제외한 나머지로 임의생성
    private String password;
    private String role;

    @Enumerated(EnumType.STRING)
    private FavoriteSongPresentType favoriteSongPresentType;
    @Enumerated(EnumType.STRING)
    private Brand favoriteSongPresentBrand;

    private String provider;
    private String providerId;

    // 이탈퇴 인증 시 사용
    private String authenticationToken;
    private LocalDateTime authenticationTimestamp;
    private int authenticationRetry; // 최대 3

    @CreationTimestamp
    private LocalDateTime createdAt;

    public void updateOauth2Email(String email) {
        this.email = email;
    }

    public void updateMemoSetting(FavoriteSongPresentType favoriteSongPresentType, Brand showMemoBrand) {
        this.favoriteSongPresentType = favoriteSongPresentType;
        this.favoriteSongPresentBrand = showMemoBrand;
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
