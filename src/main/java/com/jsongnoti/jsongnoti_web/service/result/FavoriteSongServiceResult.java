package com.jsongnoti.jsongnoti_web.service.result;

import com.jsongnoti.jsongnoti_web.repository.FavoriteSongWithKoreanDto;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data @AllArgsConstructor(access = AccessLevel.PRIVATE)
public class FavoriteSongServiceResult {

    private boolean isSuccess;
    private String message;
    private List<FavoriteSongWithKoreanDto> favoriteSongs;

    public static FavoriteSongServiceResult success(String message) {
        return new FavoriteSongServiceResult(true, message, null);
    }

    public static FavoriteSongServiceResult successWithSongs(String message, List<FavoriteSongWithKoreanDto> favoriteSongs) {
        return new FavoriteSongServiceResult(true, message, favoriteSongs);
    }

    public static FavoriteSongServiceResult fail(String message) {
        return new FavoriteSongServiceResult(false, message, null);
    }

}
