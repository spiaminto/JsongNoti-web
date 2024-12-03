package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.SongSearchType;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.repository.SongSearchResultDto;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchResult;
import com.jsongnoti.jsongnoti_web.util.RegexPatterns;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class SongSearchService {

    private final SongRepository songRepository;

    public List<SongSearchResult> searchSongs(SongSearchCond searchCond) {
        SongSearchType searchType = searchCond.getSearchType();
        String keyword = searchCond.getKeyword();

        List<SongSearchResult> searchResults = new ArrayList<>();

        boolean keywordHasKorean = RegexPatterns.hasKorean(keyword);
        switch (searchType) {
            case TITLE -> searchResults = keywordHasKorean ?
                        searchSongsByKoreanTitle(keyword) :
                        searchSongsByTitle(keyword);
            case SINGER -> searchResults = keywordHasKorean ?
                        searchSongsByKoreanSinger(keyword) :
                        searchSongsBySinger(keyword);
            case INFO -> searchResults = keywordHasKorean ?
                        searchSongsByKoreanInfo(keyword) :
                        searchSongsByInfo(keyword);
            default -> log.error("Invalid search type: {}", searchType);
        }

        // 브랜드 필터링
        searchResults = searchResults.stream().filter(song -> song.getBrand() == searchCond.getBrand()).toList();
        return searchResults;
    }

    // 원어 검색 ============================================================================
    private List<SongSearchResult> searchSongsByTitle(String title) {

        return songRepository.findSongByTitleSimilar(title).stream().map(SongSearchResult::from).toList();
    }

    private List<SongSearchResult> searchSongsBySinger(String singer) {
        return songRepository.findSongBySingerSimilar(singer).stream().map(SongSearchResult::from).toList();
    }

    private List<SongSearchResult> searchSongsByInfo(String info) {
        return songRepository.findSongByInfoSimilar(info).stream().map(SongSearchResult::from).toList();
    }

    // 한글 검색 ============================================================================
    private List<SongSearchResult> searchSongsByKoreanTitle(String koreanTitle) {
        List<SongSearchResultDto> findDtos = songRepository.findSongByKoreanTitleSimilar(koreanTitle);
        if (findDtos.isEmpty()) {
            findDtos = songRepository.findSongByKoreanTitleReadSimilar(koreanTitle);
        }
        List<SongSearchResult> searchResults = new ArrayList<>();
        searchResults = findDtos.stream().map(SongSearchResult::from).toList();
        log.info("searchResults = {}", searchResults);
        return searchResults;
    }

    private List<SongSearchResult> searchSongsByKoreanSinger(String koreanSinger) {
        List<SongSearchResultDto>findDtos = songRepository.findSongByKoreanSingerSimilar(koreanSinger);
        if (findDtos.isEmpty()) {
            findDtos = songRepository.findSongByKoreanSingerReadSimilar(koreanSinger);
        }
        List<SongSearchResult> searchResults = new ArrayList<>();
        searchResults = findDtos.stream().map(SongSearchResult::from).toList();
        log.info("searchResults = {}", searchResults);
        return searchResults;
    }

    private List<SongSearchResult> searchSongsByKoreanInfo(String koreanInfo) {
        return songRepository.findSongByKoreanInfoSimilar(koreanInfo).stream().map(SongSearchResult::from).toList();
    }

}
