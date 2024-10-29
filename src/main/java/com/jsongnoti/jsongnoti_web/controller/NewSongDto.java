package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.domain.Song;
import lombok.Data;

/**
 * index 페이지를 통해 보낼 노래 Dto
 */
@Data
public class NewSongDto {
    private int number;
    private String title;
    private String singer;
    private String info;
    private String searchUrl; // google 검색 파라미터에 노래제목 붙인 검색용 url

    public static NewSongDto fromSong(Song song) {
        NewSongDto mailSongDto = new NewSongDto();
        mailSongDto.setNumber(song.getNumber());
        mailSongDto.setTitle(song.getTitle());
        mailSongDto.setSinger(song.getSinger());
        mailSongDto.setInfo(song.getInfo());
        mailSongDto.setSearchUrl("https://www.google.com/search?q=" + song.getSinger() + " - " + song.getTitle());
        return mailSongDto;
    }
}
