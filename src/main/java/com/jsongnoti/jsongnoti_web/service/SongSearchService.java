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

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SongSearchService {

    private final SongRepository songRepository;

    public SongSearchResult searchSongs(SongSearchCond searchCond) {
        SongSearchType searchType = searchCond.getSearchType();
        String keyword = searchCond.getKeyword();
        boolean isAdditionalSearch = searchCond.isAdditionalSearch();

        boolean keywordHasKorean = RegexPatterns.hasKorean(keyword);
        List<SongSearchDto> songSearchDtos = switch (searchType) {
            case TITLE -> isAdditionalSearch ? additionalTitleSearch(keyword) :
                    keywordHasKorean ?
                            searchSongsByKoreanTitle(keyword) :
                            searchSongsByTitle(keyword);
            case SINGER -> isAdditionalSearch ? additionalSingerSearch(keyword) :
                    keywordHasKorean ?
                            searchSongsByKoreanSinger(keyword) :
                            searchSongsBySinger(keyword);
            // case INFO -> 미구현
            default -> {
                log.error("invalid search type = {}", searchType);
                yield Collections.emptyList();
            }
        };

        // 브랜드 필터링
        songSearchDtos = songSearchDtos.stream().filter(song -> song.getBrand() == searchCond.getBrand()).toList();

        return SongSearchResult.success("검색 성공", songSearchDtos);
    }

    // 원어 검색 ============================================================================
    private List<SongSearchDto> searchSongsByTitle(String title) {
        return songRepository.findSongByTitleSimilar(title, title.toUpperCase()).stream().map(SongSearchDto::from).toList();
    }

    private List<SongSearchDto> searchSongsBySinger(String singer) {
        // 수기입력
        List<SongSearchDto> findPriorDtos = songRepository.findSongBySingerPrior(singer).stream().map(SongSearchDto::from).collect(Collectors.toList());
        // 원어
        List<SongSearchDto> findOriginDtos = songRepository.findSongBySingerSimilar(singer, singer.toUpperCase()).stream().map(SongSearchDto::from).collect(Collectors.toList());

        // 수기입력 우선, 중복제거
        findOriginDtos.removeAll(findPriorDtos);
        findPriorDtos.addAll(findOriginDtos);

        log.debug("findPriorDtos = {}", findPriorDtos);
        return findPriorDtos;
    }

    // 한글 검색 ============================================================================
    private List<SongSearchDto> searchSongsByKoreanTitle(String koreanTitle) {
        List<SongSearchDto> titleSimilarDtos = songRepository.findSongByKoreanTitleSimilar(koreanTitle).stream().map(SongSearchDto::from).collect(Collectors.toList());
        List<SongSearchDto> titleReadSimilarDtos = songRepository.findSongByKoreanTitleReadSimilar(koreanTitle).stream().map(SongSearchDto::from).collect(Collectors.toList());

        // 독음우선, 중복제거
        titleSimilarDtos.removeAll(titleReadSimilarDtos);
        titleReadSimilarDtos.addAll(titleSimilarDtos);

        log.debug("titleReadSimilarDtos = {}", titleReadSimilarDtos);
        return titleReadSimilarDtos;
    }

    private List<SongSearchDto> searchSongsByKoreanSinger(String koreanSinger) {
        // 수기 입력
        List<SongSearchDto> singerPriorDtos = songRepository.findSongBySingerPrior(koreanSinger).stream().map(SongSearchDto::from).collect(Collectors.toList());
        // 자동 입력
        List<SongSearchDto> singerSimilarDtos = songRepository.findSongByKoreanSingerSimilar(koreanSinger).stream().map(SongSearchDto::from).collect(Collectors.toList());
        List<SongSearchDto> singerReadSimilarDtos = songRepository.findSongByKoreanSingerReadSimilar(koreanSinger).stream().map(SongSearchDto::from).collect(Collectors.toList());

        // 독음우선, 중복제거
        singerSimilarDtos.removeAll(singerReadSimilarDtos);
        singerReadSimilarDtos.addAll(singerSimilarDtos);

        // 수기입력 우선, 중복제거
        singerReadSimilarDtos.removeAll(singerPriorDtos);
        singerPriorDtos.addAll(singerReadSimilarDtos);

        log.debug("singerPriorDtos = {}", singerPriorDtos);
        return singerPriorDtos;
    }

// 추가검색 : 일반 like 를 전체 검색으로 걸면 검색결과가 과도하게 나오는 경우가 있어 사용자의 추가 검색필요시에만 전체 like 검색
    private List<SongSearchDto> additionalTitleSearch(String keyword) {
        List<SongSearchResultDto> songByTitleLikeOriginAndKorean = songRepository.findSongByTitleLikeOriginOrKoreanOrRead(keyword);
        return songByTitleLikeOriginAndKorean.stream().map(SongSearchDto::from).toList();
        
    }

    private List<SongSearchDto> additionalSingerSearch(String keyword) {
        List<SongSearchResultDto> songBySingerLikeOriginAndKorean = songRepository.findSongBySingerLikeOriginOrKoreanOrRead(keyword);
        return songBySingerLikeOriginAndKorean.stream().map(SongSearchDto::from).toList();
    }

}
