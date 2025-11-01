package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class SongWithKoreanDto {
    private Brand brand;
    private int songNumber;

    private String title;
    private String titleKorean;

    private String singer;
    private String singerKorean;

    private String info;

    private LocalDate regDate;
}
