package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.repository.SongSearchResultDto;
import com.jsongnoti.jsongnoti_web.util.RegexPatterns;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Setter(AccessLevel.PROTECTED)
public class SongSearchResult {

    private Long id;
    private String number;
    private String title;
    private String singer;
    private String info;
    private String titleKorean;

    public static SongSearchResult from(SongSearchResultDto dto) {
        SongSearchResult result = new SongSearchResult();
        result.setId(dto.getId());
        result.setNumber(dto.getNumber());
        result.setTitle(dto.getTitle());
        result.setSinger(dto.getSinger());
        result.setInfo(dto.getInfo());
        result.setTitleKorean(RegexPatterns.hasKorean(dto.getTitleKorean()) ? dto.getTitleKorean() : ""); // 한글 포함 안될경우 제거
        return result;
    }

}
