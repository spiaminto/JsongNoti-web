package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.repository.SongSearchResultDto;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchDto;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchGroupResult;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchResult;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SongSearchServiceTest {

    @Mock
    SongRepository songRepository;

    @InjectMocks
    SongSearchService songSearchService;

    @Test
    void infoSearchKeepsPriorityRemovesDuplicatesAndFiltersBrand() {
        SongSearchResultDto aliasTj = song(1L, Brand.TJ, "炎炎ノ消防隊 OP", "불꽃 소방대 OP");
        SongSearchResultDto aliasKy = song(2L, Brand.KY, "炎炎ノ消防隊 OP", "불꽃 소방대 OP");
        SongSearchResultDto koreanDuplicate = song(1L, Brand.TJ, "炎炎ノ消防隊 OP", "불꽃 소방대 OP");
        SongSearchResultDto koreanTj = song(3L, Brand.TJ, "炎炎ノ消防隊 ED", "불꽃 소방대 ED");
        SongSearchResultDto originDuplicate = song(3L, Brand.TJ, "炎炎ノ消防隊 ED", "불꽃 소방대 ED");
        SongSearchResultDto originTj = song(4L, Brand.TJ, "炎炎ノ消防隊 OST", "불꽃 소방대 OST");

        when(songRepository.findSongByInfoAliases("불꽃 소방대")).thenReturn(List.of(aliasTj, aliasKy));
        when(songRepository.findSongByKoreanInfoSimilar("불꽃 소방대")).thenReturn(List.of(koreanDuplicate, koreanTj));
        when(songRepository.findSongByInfoSimilar("불꽃 소방대")).thenReturn(List.of(originDuplicate, originTj));

        SongSearchCond searchCond = new SongSearchCond(SongSearchType.INFO, "불꽃 소방대", Brand.TJ, false);
        SongSearchResult result = songSearchService.searchSongs(searchCond);

        assertThat(result.getMessage()).isNull();
        assertThat(result.getSongSearchDtos())
                .extracting(SongSearchDto::getId)
                .containsExactly(1L, 3L, 4L);
        assertThat(result.getSongSearchDtos().get(0).getInfoKorean()).isEqualTo("불꽃 소방대 OP");
    }

    @ParameterizedTest
    @ValueSource(strings = {"OP", "o s t", "오프닝", "주제가", "OP / ED", "오프닝 OST"})
    void infoRoleOnlySearchReturnsGuideWithoutQuery(String keyword) {
        SongSearchCond searchCond = new SongSearchCond(SongSearchType.INFO, keyword, Brand.TJ, false);

        SongSearchResult result = songSearchService.searchSongs(searchCond);

        assertThat(result.getMessage()).isEqualTo("작품명을 함께 입력해주세요. 예: 원피스 OP");
        assertThat(result.getSongSearchDtos()).isEmpty();
        verifyNoInteractions(songRepository);
    }

    @Test
    void infoSearchWithWorkAndRoleRunsNormalSearch() {
        when(songRepository.findSongByInfoAliases("원피스 OP")).thenReturn(List.of());
        when(songRepository.findSongByKoreanInfoSimilar("원피스 OP")).thenReturn(List.of());
        when(songRepository.findSongByInfoSimilar("원피스 OP")).thenReturn(List.of());

        SongSearchCond searchCond = new SongSearchCond(SongSearchType.INFO, "원피스 OP", Brand.TJ, false);

        SongSearchResult result = songSearchService.searchSongs(searchCond);

        assertThat(result.getMessage()).isNull();
        verify(songRepository).findSongByInfoAliases("원피스 OP");
        verify(songRepository).findSongByKoreanInfoSimilar("원피스 OP");
        verify(songRepository).findSongByInfoSimilar("원피스 OP");
    }

    @Test
    void additionalInfoSearchUsesWideInfoQueryAndFiltersBrand() {
        SongSearchResultDto tjSong = song(1L, Brand.TJ, "BanG Dream! OST", "뱅드림! OST");
        SongSearchResultDto kySong = song(2L, Brand.KY, "BanG Dream! OST", "뱅드림! OST");
        when(songRepository.findSongByInfoLikeOriginOrKoreanOrAliases("BanG Dream!")).thenReturn(List.of(tjSong, kySong));

        SongSearchCond searchCond = new SongSearchCond(SongSearchType.INFO, "BanG Dream!", Brand.TJ, true);

        SongSearchResult result = songSearchService.searchSongs(searchCond);

        assertThat(result.getSongSearchDtos())
                .extracting(SongSearchDto::getId)
                .containsExactly(1L);
    }

    @Test
    void unifiedSearchOrdersStrongMatchThenSimilarityAndKeepsDuplicatesBetweenGroups() {
        SongSearchResultDto duplicatedTitle = song(1L, Brand.TJ, "炎炎ノ消防隊 OP", "불꽃 소방대 OP", 75, null, null);
        SongSearchResultDto singerOne = song(2L, Brand.TJ, "", null, 60, null, null);
        SongSearchResultDto singerTwo = song(3L, Brand.TJ, "", null, 55, null, null);
        SongSearchResultDto exactInfoAlias = song(1L, Brand.TJ, "炎炎ノ消防隊 OP", "불꽃 소방대 OP", null, "불꽃소방대, 불꽃 소방대", null);

        when(songRepository.findSongByKoreanTitleSimilar("불꽃 소방대")).thenReturn(List.of(duplicatedTitle));
        when(songRepository.findSongByKoreanSingerSimilar("불꽃 소방대")).thenReturn(List.of(singerOne, singerTwo));
        when(songRepository.findSongByInfoAliases("불꽃 소방대")).thenReturn(List.of(exactInfoAlias));

        SongSearchCond searchCond = new SongSearchCond(SongSearchType.UNIFIED, "불꽃 소방대", Brand.TJ, false);

        SongSearchResult result = songSearchService.searchSongs(searchCond);

        assertThat(result.getSongSearchGroupResults())
                .extracting(SongSearchGroupResult::getSearchType)
                .containsExactly(SongSearchType.INFO, SongSearchType.TITLE, SongSearchType.SINGER);
        assertThat(result.getSongSearchGroupResults().get(0).getSongSearchDtos())
                .extracting(SongSearchDto::getId)
                .containsExactly(1L);
        assertThat(result.getSongSearchGroupResults().get(1).getSongSearchDtos())
                .extracting(SongSearchDto::getId)
                .containsExactly(1L);
    }

    @Test
    void unifiedSearchWithoutHighSimilarityOrdersGroupsByResultCount() {
        SongSearchResultDto title = song(1L, Brand.TJ, "", null, 60, null, null);
        SongSearchResultDto singerOne = song(2L, Brand.TJ, "", null, 60, null, null);
        SongSearchResultDto singerTwo = song(3L, Brand.TJ, "", null, 55, null, null);
        when(songRepository.findSongByTitleSimilar("keyword")).thenReturn(List.of(title));
        when(songRepository.findSongBySingerSimilar("keyword")).thenReturn(List.of(singerOne, singerTwo));

        SongSearchResult result = songSearchService.searchSongs(
                new SongSearchCond(SongSearchType.UNIFIED, "keyword", Brand.TJ, false)
        );

        assertThat(result.getSongSearchGroupResults())
                .extracting(SongSearchGroupResult::getSearchType)
                .containsExactly(SongSearchType.SINGER, SongSearchType.TITLE, SongSearchType.INFO);
    }

    @Test
    void unifiedSearchLimitsEachGroupToFiftyAfterCountingAllResults() {
        List<SongSearchResultDto> titleResults = IntStream.rangeClosed(1, 55)
                .mapToObj(id -> song((long) id, Brand.TJ, "", null, 60, null, null))
                .toList();
        when(songRepository.findSongByTitleSimilar("keyword")).thenReturn(titleResults);

        SongSearchResult result = songSearchService.searchSongs(
                new SongSearchCond(SongSearchType.UNIFIED, "keyword", Brand.TJ, false)
        );

        SongSearchGroupResult titleGroup = result.getSongSearchGroupResults().stream()
                .filter(group -> group.getSearchType() == SongSearchType.TITLE)
                .findFirst()
                .orElseThrow();
        assertThat(titleGroup.getTotalCount()).isEqualTo(55);
        assertThat(titleGroup.getSongSearchDtos()).hasSize(50);
    }

    @Test
    void unifiedRoleOnlyKeywordSkipsOnlyInfoSearch() {
        SongSearchResult result = songSearchService.searchSongs(
                new SongSearchCond(SongSearchType.UNIFIED, "OP", Brand.TJ, false)
        );

        SongSearchGroupResult infoGroup = result.getSongSearchGroupResults().stream()
                .filter(group -> group.getSearchType() == SongSearchType.INFO)
                .findFirst()
                .orElseThrow();
        assertThat(infoGroup.getMessage()).isEqualTo("작품명을 함께 입력해주세요. 예: 원피스 OP");
        assertThat(infoGroup.getSongSearchDtos()).isEmpty();
        verify(songRepository).findSongByTitleSimilar("OP");
        verify(songRepository).findSongBySingerPrior("OP");
        verify(songRepository).findSongBySingerSimilar("OP");
        verifyNoInteractionsWithInfoSearch();
    }

    private void verifyNoInteractionsWithInfoSearch() {
        verify(songRepository, never()).findSongByInfoAliases(anyString());
        verify(songRepository, never()).findSongByKoreanInfoSimilar(anyString());
        verify(songRepository, never()).findSongByInfoSimilar(anyString());
    }

    private SongSearchResultDto song(Long id, Brand brand, String info, String infoKorean) {
        SongSearchResultDto song = mock(SongSearchResultDto.class);
        when(song.getId()).thenReturn(id);
        when(song.getBrand()).thenReturn(brand);
        when(song.getSongNumber()).thenReturn(String.valueOf(id));
        when(song.getTitle()).thenReturn("title " + id);
        when(song.getSinger()).thenReturn("singer " + id);
        when(song.getInfo()).thenReturn(info);
        when(song.getTitleKorean()).thenReturn("한글 제목 " + id);
        when(song.getInfoKorean()).thenReturn(infoKorean);
        return song;
    }

    private SongSearchResultDto song(Long id, Brand brand, String info, String infoKorean,
                                     Integer similarity, String infoAliases, String singerPrior) {
        SongSearchResultDto song = song(id, brand, info, infoKorean);
        if (similarity != null) {
            when(song.getSimilarity()).thenReturn(similarity);
        }
        if (infoAliases != null) {
            when(song.getInfoAliases()).thenReturn(infoAliases);
        }
        if (singerPrior != null) {
            when(song.getSingerPrior()).thenReturn(singerPrior);
        }
        return song;
    }

}
