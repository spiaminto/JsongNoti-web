package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.repository.SongSearchResultDto;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchDto;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchGroupResult;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchResult;
import com.jsongnoti.jsongnoti_web.util.RegexPatterns;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SongSearchService {

    private static final String INFO_ROLE_ONLY_MESSAGE = "작품명을 함께 입력해주세요. 예: 원피스 OP";
    private static final int UNIFIED_RESULT_LIMIT = 50;
    private static final int HIGH_SIMILARITY_THRESHOLD = 70;
    private static final List<String> INFO_ROLE_KEYWORDS = List.of(
            "OPENING", "ENDING", "오프닝", "엔딩", "주제가", "테마송", "삽입곡", "게임",
            "OST", "CM", "OP", "ED"
    );
    private static final Map<SongSearchType, Integer> UNIFIED_TYPE_ORDER = Map.of(
            SongSearchType.TITLE, 0,
            SongSearchType.SINGER, 1,
            SongSearchType.INFO, 2
    );

    private final SongRepository songRepository;

    public SongSearchResult searchSongs(SongSearchCond searchCond) {
        SongSearchType searchType = searchCond.getSearchType();
        String keyword = searchCond.getKeyword();

        if (searchType == SongSearchType.UNIFIED) {
            return searchUnifiedSongs(searchCond);
        }
        if (searchType == SongSearchType.INFO && isInfoRoleOnly(keyword)) {
            return SongSearchResult.success(INFO_ROLE_ONLY_MESSAGE, Collections.emptyList());
        }

        List<SongSearchDto> songSearchDtos;
        if (searchCond.isAdditionalSearch()) {
            songSearchDtos = additionalSearch(searchType, keyword);
        } else {
            boolean keywordHasKorean = RegexPatterns.hasKorean(keyword);
            songSearchDtos = searchByType(searchType, keyword, keywordHasKorean).songs();
        }

        return SongSearchResult.success(null, filterByBrand(songSearchDtos, searchCond));
    }

    private SongSearchResult searchUnifiedSongs(SongSearchCond searchCond) {
        String keyword = searchCond.getKeyword();
        boolean keywordHasKorean = RegexPatterns.hasKorean(keyword);
        List<UnifiedSearchGroup> groups = new ArrayList<>();

        groups.add(createUnifiedGroup(
                SongSearchType.TITLE,
                null,
                searchByType(SongSearchType.TITLE, keyword, keywordHasKorean),
                searchCond
        ));
        groups.add(createUnifiedGroup(
                SongSearchType.SINGER,
                null,
                searchByType(SongSearchType.SINGER, keyword, keywordHasKorean),
                searchCond
        ));

        boolean infoRoleOnly = isInfoRoleOnly(keyword);
        TypeSearchResult infoSearchResult = infoRoleOnly ? TypeSearchResult.empty() :
                searchByType(SongSearchType.INFO, keyword, keywordHasKorean);
        groups.add(createUnifiedGroup(
                SongSearchType.INFO,
                infoRoleOnly ? INFO_ROLE_ONLY_MESSAGE : null,
                infoSearchResult,
                searchCond
        ));

        groups.sort(this::compareUnifiedGroups);
        return SongSearchResult.successGroups(groups.stream().map(UnifiedSearchGroup::toResult).toList());
    }

    private TypeSearchResult searchByType(SongSearchType searchType, String keyword, boolean keywordHasKorean) {
        return switch (searchType) {
            case TITLE -> keywordHasKorean ? searchSongsByKoreanTitle(keyword) : searchSongsByTitle(keyword);
            case SINGER -> keywordHasKorean ? searchSongsByKoreanSinger(keyword) : searchSongsBySinger(keyword);
            case INFO -> searchSongsByInfo(keyword);
            case UNIFIED -> throw new IllegalArgumentException("통합검색은 개별 검색 유형으로 사용할 수 없습니다.");
        };
    }

    private List<SongSearchDto> additionalSearch(SongSearchType searchType, String keyword) {
        return switch (searchType) {
            case TITLE -> additionalTitleSearch(keyword);
            case SINGER -> additionalSingerSearch(keyword);
            case INFO -> additionalInfoSearch(keyword);
            case UNIFIED -> throw new IllegalArgumentException("통합검색에는 유형별 추가 검색을 사용해야 합니다.");
        };
    }

    private UnifiedSearchGroup createUnifiedGroup(SongSearchType searchType, String message,
                                                   TypeSearchResult searchResult, SongSearchCond searchCond) {
        List<SongSearchDto> filteredSongs = filterByBrand(searchResult.songs(), searchCond);
        Integer topMatchScore = filteredSongs.stream()
                .map(song -> searchResult.matchScoresBySongId().get(song.getId()))
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(null);

        return new UnifiedSearchGroup(
                searchType,
                message,
                filteredSongs.size(),
                topMatchScore,
                filteredSongs.stream().limit(UNIFIED_RESULT_LIMIT).toList()
        );
    }

    private int compareUnifiedGroups(UnifiedSearchGroup first, UnifiedSearchGroup second) {
        boolean firstHasHighSimilarity = first.topMatchScore() != null &&
                first.topMatchScore() >= HIGH_SIMILARITY_THRESHOLD;
        boolean secondHasHighSimilarity = second.topMatchScore() != null &&
                second.topMatchScore() >= HIGH_SIMILARITY_THRESHOLD;

        if (firstHasHighSimilarity != secondHasHighSimilarity) {
            return firstHasHighSimilarity ? -1 : 1;
        }
        if (firstHasHighSimilarity) {
            int similarityCompare = Integer.compare(second.topMatchScore(), first.topMatchScore());
            if (similarityCompare != 0) {
                return similarityCompare;
            }
        }

        int countCompare = Integer.compare(second.totalCount(), first.totalCount());
        if (countCompare != 0) {
            return countCompare;
        }
        return Integer.compare(
                UNIFIED_TYPE_ORDER.get(first.searchType()),
                UNIFIED_TYPE_ORDER.get(second.searchType())
        );
    }

    private List<SongSearchDto> filterByBrand(List<SongSearchDto> songs, SongSearchCond searchCond) {
        return songs.stream().filter(song -> song.getBrand() == searchCond.getBrand()).toList();
    }

    // 원어 검색 ============================================================================
    private TypeSearchResult searchSongsByTitle(String title) {
        List<SongSearchResultDto> titleResults = songRepository.findSongByTitleSimilar(title);
        Map<Long, Integer> matchScoresBySongId = new HashMap<>();
        addSimilarityScores(matchScoresBySongId, titleResults);
        return new TypeSearchResult(titleResults.stream().map(SongSearchDto::from).toList(), matchScoresBySongId);
    }

    private TypeSearchResult searchSongsBySinger(String singer) {
        // 수기입력
        List<SongSearchResultDto> priorResults = songRepository.findSongBySingerPrior(singer);
        List<SongSearchDto> priorSongs = priorResults.stream().map(SongSearchDto::from).collect(Collectors.toList());
        // 원어
        List<SongSearchResultDto> originResults = songRepository.findSongBySingerSimilar(singer);
        List<SongSearchDto> originSongs = originResults.stream().map(SongSearchDto::from).collect(Collectors.toList());

        // 수기입력 우선, 중복제거
        originSongs.removeAll(priorSongs);
        priorSongs.addAll(originSongs);

        Map<Long, Integer> matchScoresBySongId = new HashMap<>();
        addExactMatchScores(matchScoresBySongId, priorResults, singer, SongSearchResultDto::getSingerPrior);
        addSimilarityScores(matchScoresBySongId, originResults);

        log.debug("priorSongs = {}", priorSongs);
        return new TypeSearchResult(priorSongs, matchScoresBySongId);
    }

    // 한글 검색 ============================================================================
    private TypeSearchResult searchSongsByKoreanTitle(String koreanTitle) {
        List<SongSearchResultDto> titleSimilarResults = songRepository.findSongByKoreanTitleSimilar(koreanTitle);
        List<SongSearchDto> titleSimilarSongs = titleSimilarResults.stream().map(SongSearchDto::from).collect(Collectors.toList());
        List<SongSearchResultDto> titleReadSimilarResults = songRepository.findSongByKoreanTitleReadSimilar(koreanTitle);
        List<SongSearchDto> titleReadSimilarSongs = titleReadSimilarResults.stream().map(SongSearchDto::from).collect(Collectors.toList());

        // 독음우선, 중복제거
        titleSimilarSongs.removeAll(titleReadSimilarSongs);
        titleReadSimilarSongs.addAll(titleSimilarSongs);

        Map<Long, Integer> matchScoresBySongId = new HashMap<>();
        addSimilarityScores(matchScoresBySongId, titleSimilarResults);
        addSimilarityScores(matchScoresBySongId, titleReadSimilarResults);

        log.debug("titleReadSimilarSongs = {}", titleReadSimilarSongs);
        return new TypeSearchResult(titleReadSimilarSongs, matchScoresBySongId);
    }

    private TypeSearchResult searchSongsByKoreanSinger(String koreanSinger) {
        // 수기 입력
        List<SongSearchResultDto> singerPriorResults = songRepository.findSongBySingerPrior(koreanSinger);
        List<SongSearchDto> singerPriorSongs = singerPriorResults.stream().map(SongSearchDto::from).collect(Collectors.toList());
        // 자동 입력
        List<SongSearchResultDto> singerSimilarResults = songRepository.findSongByKoreanSingerSimilar(koreanSinger);
        List<SongSearchDto> singerSimilarSongs = singerSimilarResults.stream().map(SongSearchDto::from).collect(Collectors.toList());
        List<SongSearchResultDto> singerReadSimilarResults = songRepository.findSongByKoreanSingerReadSimilar(koreanSinger);
        List<SongSearchDto> singerReadSimilarSongs = singerReadSimilarResults.stream().map(SongSearchDto::from).collect(Collectors.toList());

        // 독음우선, 중복제거
        singerSimilarSongs.removeAll(singerReadSimilarSongs);
        singerReadSimilarSongs.addAll(singerSimilarSongs);

        // 수기입력 우선, 중복제거
        singerReadSimilarSongs.removeAll(singerPriorSongs);
        singerPriorSongs.addAll(singerReadSimilarSongs);

        Map<Long, Integer> matchScoresBySongId = new HashMap<>();
        addExactMatchScores(matchScoresBySongId, singerPriorResults, koreanSinger, SongSearchResultDto::getSingerPrior);
        addSimilarityScores(matchScoresBySongId, singerSimilarResults);
        addSimilarityScores(matchScoresBySongId, singerReadSimilarResults);

        log.debug("singerPriorSongs = {}", singerPriorSongs);
        return new TypeSearchResult(singerPriorSongs, matchScoresBySongId);
    }

    // 작품 정보 검색 ========================================================================
    private TypeSearchResult searchSongsByInfo(String keyword) {
        List<SongSearchResultDto> infoAliasResults = songRepository.findSongByInfoAliases(keyword);
        List<SongSearchDto> infoAliasSongs = infoAliasResults.stream().map(SongSearchDto::from).toList();
        List<SongSearchResultDto> infoKoreanResults = songRepository.findSongByKoreanInfoSimilar(keyword);
        List<SongSearchDto> infoKoreanSongs = infoKoreanResults.stream().map(SongSearchDto::from).toList();
        List<SongSearchResultDto> infoOriginResults = songRepository.findSongByInfoSimilar(keyword);
        List<SongSearchDto> infoOriginSongs = infoOriginResults.stream().map(SongSearchDto::from).toList();

        // 별칭, 한글 대표값, 원문 순으로 합치면서 곡 ID 기준 중복 제거
        Map<Long, SongSearchDto> songsById = new LinkedHashMap<>();
        infoAliasSongs.forEach(song -> songsById.putIfAbsent(song.getId(), song));
        infoKoreanSongs.forEach(song -> songsById.putIfAbsent(song.getId(), song));
        infoOriginSongs.forEach(song -> songsById.putIfAbsent(song.getId(), song));

        Map<Long, Integer> matchScoresBySongId = new HashMap<>();
        addExactMatchScores(matchScoresBySongId, infoAliasResults, keyword, SongSearchResultDto::getInfoAliases);
        addSimilarityScores(matchScoresBySongId, infoKoreanResults);
        addSimilarityScores(matchScoresBySongId, infoOriginResults);

        return new TypeSearchResult(List.copyOf(songsById.values()), matchScoresBySongId);
    }

    private void addSimilarityScores(Map<Long, Integer> matchScoresBySongId,
                                     List<SongSearchResultDto> searchResults) {
        for (SongSearchResultDto searchResult : searchResults) {
            if (searchResult.getSimilarity() != null) {
                matchScoresBySongId.merge(searchResult.getId(), searchResult.getSimilarity(), Math::max);
            }
        }
    }

    private void addExactMatchScores(Map<Long, Integer> matchScoresBySongId,
                                     List<SongSearchResultDto> searchResults,
                                     String keyword,
                                     Function<SongSearchResultDto, String> candidatesExtractor) {
        for (SongSearchResultDto searchResult : searchResults) {
            if (containsExactSearchValue(candidatesExtractor.apply(searchResult), keyword)) {
                matchScoresBySongId.put(searchResult.getId(), 100);
            }
        }
    }

    private boolean containsExactSearchValue(String candidates, String keyword) {
        if (candidates == null || keyword == null) {
            return false;
        }
        String normalizedKeyword = normalizeSearchValue(keyword);
        for (String candidate : candidates.split(",")) {
            if (normalizeSearchValue(candidate).equals(normalizedKeyword)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeSearchValue(String value) {
        return value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    private boolean isInfoRoleOnly(String keyword) {
        if (keyword == null) {
            return false;
        }
        String normalizedKeyword = keyword.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
        boolean hasRoleKeyword = false;
        for (String roleKeyword : INFO_ROLE_KEYWORDS) {
            if (normalizedKeyword.contains(roleKeyword)) {
                normalizedKeyword = normalizedKeyword.replace(roleKeyword, "");
                hasRoleKeyword = true;
            }
        }
        String remainingKeyword = normalizedKeyword.replaceAll("[,/&+·-]", "");
        return hasRoleKeyword && remainingKeyword.isEmpty();
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

    private List<SongSearchDto> additionalInfoSearch(String keyword) {
        return songRepository.findSongByInfoLikeOriginOrKoreanOrAliases(keyword).stream()
                .map(SongSearchDto::from)
                .toList();
    }

    private record TypeSearchResult(List<SongSearchDto> songs, Map<Long, Integer> matchScoresBySongId) {

        private static TypeSearchResult empty() {
            return new TypeSearchResult(Collections.emptyList(), Collections.emptyMap());
        }
    }

    private record UnifiedSearchGroup(SongSearchType searchType, String message, int totalCount,
                                      Integer topMatchScore, List<SongSearchDto> songs) {

        private SongSearchGroupResult toResult() {
            return SongSearchGroupResult.of(searchType, message, totalCount, songs);
        }
    }
}
