package com.jsongnoti.jsongnoti_web.controller.dto;

import com.jsongnoti.jsongnoti_web.service.dto.SongSearchDto;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder @Getter
public class SongSearchResponse {

    private String message;
    private List<SongSearchDto> songs;
}
