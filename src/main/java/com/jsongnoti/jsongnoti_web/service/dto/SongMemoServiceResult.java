package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.SongMemo;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data @AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SongMemoServiceResult {

    private boolean isSuccess;
    private String message;
    private List<SongMemo> songMemos;

    public static SongMemoServiceResult success(String message) {
        return new SongMemoServiceResult(true, message, null);
    }

    public static SongMemoServiceResult successWithMemos(String message, List<SongMemo> songMemos) {
        return new SongMemoServiceResult(true, message, songMemos);
    }

    public static SongMemoServiceResult fail(String message) {
        return new SongMemoServiceResult(false, message, null);
    }

}
