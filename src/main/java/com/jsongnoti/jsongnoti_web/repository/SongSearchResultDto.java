package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;

public interface SongSearchResultDto {
    Long getId();
    Brand getBrand();
    String getNumber();
    String getTitle();
    String getSinger();
    String getInfo();
    String getTitleKorean();
}
