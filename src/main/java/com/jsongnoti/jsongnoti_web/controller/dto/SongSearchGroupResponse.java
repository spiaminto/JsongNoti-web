package com.jsongnoti.jsongnoti_web.controller.dto;

import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchDto;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchGroupResult;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class SongSearchGroupResponse {

    private SongSearchType searchType;
    private String message;
    private int totalCount;
    private List<SongSearchDto> songs;

    public static SongSearchGroupResponse from(SongSearchGroupResult result) {
        return SongSearchGroupResponse.builder()
                .searchType(result.getSearchType())
                .message(result.getMessage())
                .totalCount(result.getTotalCount())
                .songs(result.getSongSearchDtos())
                .build();
    }
}
