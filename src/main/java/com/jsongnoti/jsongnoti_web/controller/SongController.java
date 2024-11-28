package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.form.search.SongSearchForm;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.domain.SongSearchType;
import com.jsongnoti.jsongnoti_web.service.SongService;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
public class SongController {

    private final SongService songService;

    @GetMapping("/songs")
    public List<Song> songs(@ModelAttribute SongSearchForm songSearchForm) {
        log.info("songSearchForm: {}", songSearchForm);

        // form 검증

        SongSearchCond songSearchCond = new SongSearchCond(songSearchForm.getSearchType(), songSearchForm.getKeyword());
        List<Song> songs = songService.searchSongs(songSearchCond);

        return songs;
    }


}
