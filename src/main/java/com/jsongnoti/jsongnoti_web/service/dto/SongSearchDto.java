package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.repository.SongSearchResultDto;
import com.jsongnoti.jsongnoti_web.util.RegexPatterns;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Setter(AccessLevel.PROTECTED)
public class SongSearchDto {

    private Long id;
    private Brand brand;
    private String songNumber;
    private String title;
    private String singer;
    private String info;
    private String titleKorean;

    public static SongSearchDto from(SongSearchResultDto dto) {
        SongSearchDto result = new SongSearchDto();
        result.setId(dto.getId());
        result.setBrand(dto.getBrand());
        result.setSongNumber(dto.getSongNumber());
        result.setTitle(dto.getTitle());
        result.setSinger(dto.getSinger());
        result.setInfo(dto.getInfo() == null ? "" : dto.getInfo()); // 오라클은 '' == null 이여서 별도처리
        result.setTitleKorean(RegexPatterns.hasKorean(dto.getTitleKorean()) ? dto.getTitleKorean() : ""); // 한글 포함 안될경우 제거
        return result;
    }

}
