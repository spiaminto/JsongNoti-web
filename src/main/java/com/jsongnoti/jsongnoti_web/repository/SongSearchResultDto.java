package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;

public interface SongSearchResultDto {
    Long getId();
    Brand getBrand();
    String getSongNumber();
    String getTitle();
    String getSinger();
    String getInfo();
    String getTitleKorean();
    String getSingerKorean(); // 아티스트 대표값 — 같은 줄 병기용 (4기 9턴)
    String getInfoKorean();
    Integer getSimilarity();
    String getInfoAliases();
    String getSingerPrior();
}
