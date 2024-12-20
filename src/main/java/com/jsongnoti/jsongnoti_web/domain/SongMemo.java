package com.jsongnoti.jsongnoti_web.domain;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import jakarta.persistence.*;
import lombok.*;

import static lombok.AccessLevel.PROTECTED;

@Entity
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PROTECTED)
@Builder
@Getter
@EqualsAndHashCode
public class SongMemo {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Enumerated(EnumType.STRING)
    private Brand brand;
    private int number;
    private String title;
    private String singer;

    private String info;
    private int presentOrder; // 표시순서, start from 0

    public void updatePresentOrder(int presentOrder) {
        this.presentOrder = presentOrder;
    }

}
