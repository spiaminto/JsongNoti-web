package com.jsongnoti.jsongnoti_web.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

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

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String username; // email 에서 @ 제외한 나머지로 임의생성
    private String password;
    private String role;

    private String memoOrderType;

    private String provider;
    private String providerId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public void updateOauth2Email(String email) {
        this.email = email;
    }



}
