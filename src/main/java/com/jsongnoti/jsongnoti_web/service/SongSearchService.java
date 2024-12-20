package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.repository.SongSearchResultDto;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchDto;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchResult;
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

    public SongSearchResult searchSongs(SongSearchCond searchCond) {
        SongSearchType searchType = searchCond.getSearchType();
        String keyword = searchCond.getKeyword();

        List<SongSearchDto> songSearchDtos = new ArrayList<>();

        boolean keywordHasKorean = RegexPatterns.hasKorean(keyword);
        switch (searchType) {
            case TITLE -> songSearchDtos = keywordHasKorean ?
                        searchSongsByKoreanTitle(keyword) :
                        searchSongsByTitle(keyword);
            case SINGER -> songSearchDtos = keywordHasKorean ?
                        searchSongsByKoreanSinger(keyword) :
                        searchSongsBySinger(keyword);
            case INFO -> songSearchDtos = keywordHasKorean ?
                        searchSongsByKoreanInfo(keyword) :
                        searchSongsByInfo(keyword);
            default -> log.error("Invalid search type: {}", searchType);
        }

        // 브랜드 필터링
        songSearchDtos = songSearchDtos.stream().filter(song -> song.getBrand() == searchCond.getBrand()).toList();

        return SongSearchResult.success("검색 성공", songSearchDtos);
    }

    // 원어 검색 ============================================================================
    private List<SongSearchDto> searchSongsByTitle(String title) {

        return songRepository.findSongByTitleSimilar(title).stream().map(SongSearchDto::from).toList();
    }

    private List<SongSearchDto> searchSongsBySinger(String singer) {
        return songRepository.findSongBySingerSimilar(singer).stream().map(SongSearchDto::from).toList();
    }

    private List<SongSearchDto> searchSongsByInfo(String info) {
        return songRepository.findSongByInfoSimilar(info).stream().map(SongSearchDto::from).toList();
    }

    // 한글 검색 ============================================================================
    private List<SongSearchDto> searchSongsByKoreanTitle(String koreanTitle) {
        List<SongSearchResultDto> findDtos = songRepository.findSongByKoreanTitleSimilar(koreanTitle);
        if (findDtos.isEmpty()) {
            findDtos = songRepository.findSongByKoreanTitleReadSimilar(koreanTitle);
        }
        List<SongSearchDto> searchResults = new ArrayList<>();
        searchResults = findDtos.stream().map(SongSearchDto::from).toList();
        log.info("searchResults = {}", searchResults);
        return searchResults;
    }

    private List<SongSearchDto> searchSongsByKoreanSinger(String koreanSinger) {
        List<SongSearchResultDto>findDtos = songRepository.findSongByKoreanSingerSimilar(koreanSinger);
        if (findDtos.isEmpty()) {
            findDtos = songRepository.findSongByKoreanSingerReadSimilar(koreanSinger);
        }
        List<SongSearchDto> searchResults = new ArrayList<>();
        searchResults = findDtos.stream().map(SongSearchDto::from).toList();
        log.info("searchResults = {}", searchResults);
        return searchResults;
    }

    private List<SongSearchDto> searchSongsByKoreanInfo(String koreanInfo) {
        return songRepository.findSongByKoreanInfoSimilar(koreanInfo).stream().map(SongSearchDto::from).toList();
    }

}
