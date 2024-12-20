package com.jsongnoti.jsongnoti_web.controller.dto;

import com.jsongnoti.jsongnoti_web.domain.SongMemo;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder @Getter
public class SongMemoResponse {
    private String message;
    private List<SongMemo> songMemos;

    public static SongMemoResponse withMessage(String message) {
        return SongMemoResponse.builder()
                .message(message)
                .songMemos(null)
                .build();
    }

}
