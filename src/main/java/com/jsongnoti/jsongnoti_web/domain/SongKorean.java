package com.jsongnoti.jsongnoti_web.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PROTECTED;

@Entity
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PROTECTED)
@Builder
@Getter
@EqualsAndHashCode
@ToString
public class SongKorean {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;
    private Long songId;
    private Integer songNumber;

    private String title;
    private String titleOrigin;
    private String titleRead;

    private String singer;
    private String singerOrigin;
    private String singerRead;
    private String singerPrior;

    private String model;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
