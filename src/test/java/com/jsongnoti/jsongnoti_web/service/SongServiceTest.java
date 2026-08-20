package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.repository.SongWithKoreanDto;
import com.jsongnoti.jsongnoti_web.service.dto.LatestAndLastSongsDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SongServiceTest {

    @Mock
    SongRepository songRepository;

    @InjectMocks
    SongService songService;

    @Test
    void missingKySongsReturnsEmptyKyLists() {
        SongWithKoreanDto tjSong = new SongWithKoreanDto(
                Brand.TJ,
                1,
                "title",
                "제목",
                "singer",
                "가수",
                "info",
                "정보",
                LocalDate.now()
        );
        when(songRepository.findSongsBetweenTime(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(tjSong));

        LatestAndLastSongsDto result = songService.getLatestAndLastSongs();

        assertThat(result.getTjLatestMonthSongs()).containsExactly(tjSong);
        assertThat(result.getKyLatestMonthSongs()).isEmpty();
        assertThat(result.getKyLastMonthSongs()).isEmpty();
    }
}
