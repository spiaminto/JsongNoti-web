package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.form.search.SongSearchForm;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.service.SongSearchService;
import com.jsongnoti.jsongnoti_web.service.SongService;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
public class SongController {

    private final SongService songService;
    private final SongSearchService songSearchService;

    @GetMapping("/songs")
    public ResponseEntity<List<SongSearchResult>> songs(@ModelAttribute SongSearchForm songSearchForm) {
        log.info("songSearchForm: {}", songSearchForm);

        // form 검증

        SongSearchCond songSearchCond = new SongSearchCond(songSearchForm.getSearchType(), songSearchForm.getKeyword(), songSearchForm.getBrand());
        List<SongSearchResult> results = songSearchService.searchSongs(songSearchCond);

        return ResponseEntity.ok().body(results);
    }


}
