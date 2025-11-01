package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class FavoriteSongWithKoreanDto {
    private Long id;
    private Long memberId;

    private Brand brand;
    private int songNumber;
    private String title;
    private String titleKorean;
    private String singer;
    private String singerKorean;

    private String info;
    private int presentOrder; // 표시순서, start from 0

}
