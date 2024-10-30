package com.jsongnoti.jsongnoti_web.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static lombok.AccessLevel.PROTECTED;

@Entity
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PROTECTED)
@Builder
@Getter
@EqualsAndHashCode(of = {"number", "title"}) @ToString // 노래 번호, 제목으로 중복판별
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Brand brand;

    private int number;
    private String title;
    private String info;

    private String singer;
    private String composer;
    private String writer;

    private LocalDate regDate;

    @Builder.Default
    private boolean mailed = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

}
