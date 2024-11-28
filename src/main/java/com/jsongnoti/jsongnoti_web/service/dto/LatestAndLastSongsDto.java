package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.Song;
import lombok.*;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;

@Builder @Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
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
