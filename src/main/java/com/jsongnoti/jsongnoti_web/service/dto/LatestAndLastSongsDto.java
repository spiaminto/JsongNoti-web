package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.repository.SongWithKoreanDto;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;

@Builder @Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class LatestAndLastSongsDto {

    private List<SongWithKoreanDto> tjLatestMonthSongs;
    private List<SongWithKoreanDto> tjLastMonthSongs;
    private List<SongWithKoreanDto> kyLatestMonthSongs;
    private List<SongWithKoreanDto> kyLastMonthSongs;

    private LocalDate tjLatestDate;
    private LocalDate kyLatestDate;
    private Month tjLatestMonth;
    private Month tjLastMonth;
    private Month kyLatestMonth;
    private Month kyLastMonth;

}
