package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.Song;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;

@Data @Builder
public class LatestAndLastSongsDto {


    private List<Song> tjLatestMonthSongs;
    private List<Song> tjLastMonthSongs;
    private List<Song> kyLatestMonthSongs;
    private List<Song> kyLastMonthSongs;

    private LocalDate tjLatestDate;
    private LocalDate kyLatestDate;
    private Month tjLatestMonth;
    private Month tjLastMonth;
    private Month kyLatestMonth;
    private Month kyLastMonth;

}
