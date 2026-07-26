package com.jsongnoti.jsongnoti_web.service.result;

import com.jsongnoti.jsongnoti_web.service.dto.SongSearchDto;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class SongSearchResult {

    private boolean isSuccess;
    private String message;
    private List<SongSearchDto> songSearchDtos;
    private List<SongSearchGroupResult> songSearchGroupResults;

    public static SongSearchResult success(String message) {
        return new SongSearchResult(true, message, null, null);
    }

    public static SongSearchResult success(String message, List<SongSearchDto> songSearchDtos) {
        return new SongSearchResult(true, message, songSearchDtos, null);
    }

    public static SongSearchResult successGroups(List<SongSearchGroupResult> songSearchGroupResults) {
        return new SongSearchResult(true, null, null, songSearchGroupResults);
    }

    public static SongSearchResult fail(String message) {
        return new SongSearchResult(false, message, null, null);
    }

}
