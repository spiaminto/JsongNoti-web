package com.jsongnoti.jsongnoti_web.service.result;

import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchDto;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class SongSearchGroupResult {

    private SongSearchType searchType;
    private String message;
    private int totalCount;
    private List<SongSearchDto> songSearchDtos;

    public static SongSearchGroupResult of(SongSearchType searchType, String message, int totalCount,
                                           List<SongSearchDto> songSearchDtos) {
        return new SongSearchGroupResult(searchType, message, totalCount, songSearchDtos);
    }
}
