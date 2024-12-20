package com.jsongnoti.jsongnoti_web.controller.dto;

import com.jsongnoti.jsongnoti_web.domain.Song;
import lombok.*;

import java.time.LocalDate;

/**
 * index 페이지를 통해 보낼 노래 Dto
 */

@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Setter(value = AccessLevel.PRIVATE)
@Getter
public class NewSongDto {
    private int number;
    private String title;
    private String singer;
    private String info;
    private String searchUrl; // google 검색 파라미터에 노래제목 붙인 검색용 url
    private boolean latest; // 가장 최근에 추가된 노래인지 여부

    public static NewSongDto fromSongWithLatest(Song song, LocalDate latestDate) {
        NewSongDto dto = new NewSongDto();
        dto.setNumber(song.getNumber());
        dto.setTitle(song.getTitle());
        dto.setSinger(song.getSinger());
        dto.setInfo(song.getInfo());
        dto.setLatest(song.getRegDate().isEqual(latestDate)); // 이부분 때문에 분리. 나중에 수정요망
        dto.setSearchUrl("https://www.google.com/search?q=" + song.getSinger() + " - " + song.getTitle());
        return dto;
    }

    public static NewSongDto fromSong(Song song) {
        NewSongDto dto = new NewSongDto();
        dto.setNumber(song.getNumber());
        dto.setTitle(song.getTitle());
        dto.setSinger(song.getSinger());
        dto.setInfo(song.getInfo());
        dto.setLatest(false);
        dto.setSearchUrl("https://www.google.com/search?q=" + song.getSinger() + " - " + song.getTitle());
        return dto;
    }
}
