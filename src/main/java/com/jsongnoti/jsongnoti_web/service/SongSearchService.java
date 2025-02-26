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
        return songRepository.findSongByTitleSimilar(title).stream().map(SongSearchDto::from).toList();
    }

    private List<SongSearchDto> searchSongsBySinger(String singer) {
        // 수기입력
        List<SongSearchDto> findPriorDtos = songRepository.findSongBySingerPrior(singer).stream().map(SongSearchDto::from).collect(Collectors.toList());
        // 원어
        List<SongSearchDto> findOriginDtos = songRepository.findSongBySingerSimilar(singer).stream().map(SongSearchDto::from).collect(Collectors.toList());
        // 수기입력 값과 원어 값 중복제거 후 합치기
        findOriginDtos.removeAll(findPriorDtos);
        findPriorDtos.addAll(findOriginDtos);
        return findPriorDtos;
    }

    private List<SongSearchDto> searchSongsByInfo(String info) {
        return songRepository.findSongByInfoSimilar(info).stream().map(SongSearchDto::from).toList();
    }

    // 한글 검색 ============================================================================
    private List<SongSearchDto> searchSongsByKoreanTitle(String koreanTitle) {
        List<SongSearchDto> titleSimilarDtos = songRepository.findSongByKoreanTitleSimilar(koreanTitle).stream().map(SongSearchDto::from).collect(Collectors.toList());
        List<SongSearchDto> titleReadSimilarDtos = songRepository.findSongByKoreanTitleReadSimilar(koreanTitle).stream().map(SongSearchDto::from).collect(Collectors.toList());

        titleSimilarDtos.removeAll(titleReadSimilarDtos);
        titleReadSimilarDtos.addAll(titleSimilarDtos);

        List<SongSearchDto> searchResults = new ArrayList<>();
        searchResults = titleReadSimilarDtos;
        log.info("searchResults = {}", searchResults);
        return searchResults;
    }

    private List<SongSearchDto> searchSongsByKoreanSinger(String koreanSinger) {
        // 수기 입력 - likequery 로 찾기
        List<SongSearchResultDto> findPriorDtos = songRepository.findSongBySingerPrior(koreanSinger);
        // 자동 입력 - 유사도로 찾기
        List<SongSearchResultDto> findDtos = songRepository.findSongByKoreanSingerSimilar(koreanSinger);
        if (findDtos.isEmpty()) {
            findDtos = songRepository.findSongByKoreanSingerReadSimilar(koreanSinger);
        }
        // interface 를 dto 로 변환
        List<SongSearchDto> priorDtos = findPriorDtos.stream().map(SongSearchDto::from).collect(Collectors.toList());
        List<SongSearchDto> dtos = findDtos.stream().map(SongSearchDto::from).collect(Collectors.toList());

        // 자동입력 값을 유사도로 찾은 결과에서 수기입력 값을 likeQuery 찾읁 결과를 제외 (중복제거)
        dtos.removeAll(priorDtos);
        // 수기입력 값을 likeQuery 로 찾은 결과 뒤에 자동입력 값을 유사도로 찾은 결과를 붙임
        priorDtos.addAll(dtos);

        List<SongSearchDto> searchResults = priorDtos;
        log.info("searchResults = {}", searchResults);
        return searchResults;
    }

// 추가검색 : 일반 like 를 전체 검색으로 걸면 검색결과가 과도하게 나오는 경우가 있어 사용자의 추가 검색필요시 전체 like 검색
    private List<SongSearchDto> additionalTitleSearch(String keyword) {
        List<SongSearchResultDto> songByTitleLikeOriginAndKorean = songRepository.findSongByTitleLikeOriginOrKoreanOrRead(keyword);
        return songByTitleLikeOriginAndKorean.stream().map(SongSearchDto::from).toList();
        
    }

    private List<SongSearchDto> additionalSingerSearch(String keyword) {
        List<SongSearchResultDto> songBySingerLikeOriginAndKorean = songRepository.findSongBySingerLikeOriginOrKoreanOrRead(keyword);
        return songBySingerLikeOriginAndKorean.stream().map(SongSearchDto::from).toList();
    }

//    private List<SongSearchDto> searchSongsByKoreanInfo(String koreanInfo) {
//        return songRepository.findSongByKoreanInfoSimilar(koreanInfo).stream().map(SongSearchDto::from).toList();
//    }

}
