package com.jsongnoti.jsongnoti_web.controller.dto;

import com.jsongnoti.jsongnoti_web.repository.SongWithKoreanDto;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.regex.Pattern;

/**
 * index 페이지를 통해 보낼 노래 Dto
 */

@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Setter(value = AccessLevel.PRIVATE)
@Getter
public class NewSongDto {
    private int number;
    private String title;
    private String titleKorean;
    private String singer;
    private String singerKorean;
    private String info;
    private String searchUrl; // google 검색 파라미터에 노래제목 붙인 검색용 url
    private boolean latest; // 가장 최근에 추가된 노래인지 여부

    public static NewSongDto fromSongWithLatest(SongWithKoreanDto song, LocalDate latestDate) {
        NewSongDto dto = new NewSongDto();
        dto.setNumber(song.getSongNumber());
        dto.setTitle(song.getTitle());
        dto.setTitleKorean(hasJapanese(song.getTitle()) ? song.getTitleKorean() : ""); // 일본어가 있는경우 루비로 사용하기 위해 koreanTitle set
        dto.setSinger(song.getSinger());
        dto.setSingerKorean(song.getSingerKorean());
        dto.setInfo(song.getInfo());
        dto.setLatest(song.getRegDate().isEqual(latestDate)); // 이부분 때문에 분리. 나중에 수정요망
        dto.setSearchUrl("https://www.google.com/search?q=" + song.getSinger() + " - " + song.getTitle());
        return dto;
    }

    public static NewSongDto fromSong(SongWithKoreanDto song) {
        NewSongDto dto = new NewSongDto();
        dto.setNumber(song.getSongNumber());
        dto.setTitle(song.getTitle());
        dto.setTitleKorean(hasJapanese(song.getTitle()) ? song.getTitleKorean() : "");
        dto.setSinger(song.getSinger());
        dto.setSingerKorean(song.getSingerKorean());
        dto.setInfo(song.getInfo());
        dto.setLatest(false);
        dto.setSearchUrl("https://www.google.com/search?q=" + song.getSinger() + " - " + song.getTitle());
        return dto;
    }

    protected static boolean hasJapanese(String text) {
        Pattern pattern = Pattern.compile("[\\p{InHiragana}\\p{InKatakana}\\p{InCJKUnifiedIdeographs}]");
        return pattern.matcher(text).find();
    }

}
