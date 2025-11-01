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
}
