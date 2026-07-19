package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.repository.SongSearchResultDto;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchDto;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchResult;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
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

}
