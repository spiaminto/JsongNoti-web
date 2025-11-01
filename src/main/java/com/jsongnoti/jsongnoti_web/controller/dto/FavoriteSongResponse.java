package com.jsongnoti.jsongnoti_web.controller.dto;

import com.jsongnoti.jsongnoti_web.repository.FavoriteSongWithKoreanDto;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder @Getter
public class FavoriteSongResponse {
    private String message;
    private List<FavoriteSongWithKoreanDto> favoriteSongs;

    public static FavoriteSongResponse withMessage(String message) {
        return FavoriteSongResponse.builder()
                .message(message)
                .favoriteSongs(null)
                .build();
    }

}
