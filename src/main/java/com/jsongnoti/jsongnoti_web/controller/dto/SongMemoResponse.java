package com.jsongnoti.jsongnoti_web.controller.dto;

import com.jsongnoti.jsongnoti_web.domain.SongMemo;
import lombok.Getter;

import java.util.List;

@Getter
public class SongMemoResponse {

    private String message;
    private List<SongMemo> songMemos;

    private SongMemoResponse(String message) {
        this.message = message;
    }

    public static SongMemoResponse withMessage(String message) {
        return new SongMemoResponse(message);
    }

    public static SongMemoResponse withMessageAndSongMemos(String message, List<SongMemo> songMemos) {
        SongMemoResponse response = new SongMemoResponse(message);
        response.songMemos = songMemos;
        return response;
    }

}
