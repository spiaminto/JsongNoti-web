package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.SongSearchGroupResponse;
import com.jsongnoti.jsongnoti_web.controller.dto.SongSearchResponse;
import com.jsongnoti.jsongnoti_web.controller.form.search.SongSearchRequest;
import com.jsongnoti.jsongnoti_web.service.SongSearchService;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchResult;
import jakarta.validation.Valid;
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

    private final SongSearchService songSearchService;

    @GetMapping("/songs")
    public ResponseEntity<SongSearchResponse> songs(@Valid @ModelAttribute SongSearchRequest songSearchRequest) {
        log.info("songSearchForm: {}", songSearchRequest);

        SongSearchCond songSearchCond = new SongSearchCond(songSearchRequest.getSearchType(), songSearchRequest.getKeyword(), songSearchRequest.getBrand(), songSearchRequest.isAdditionalSearch());
        SongSearchResult results = songSearchService.searchSongs(songSearchCond);

        List<SongSearchGroupResponse> groups = results.getSongSearchGroupResults() == null ? null :
                results.getSongSearchGroupResults().stream().map(SongSearchGroupResponse::from).toList();

        return ResponseEntity.ok().body(SongSearchResponse.builder()
                .message(results.getMessage())
                .songs(results.getSongSearchDtos())
                .groups(groups)
                .build());
    }
}
