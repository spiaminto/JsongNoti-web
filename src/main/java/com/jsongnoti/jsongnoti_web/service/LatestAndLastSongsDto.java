package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.Song;
import lombok.Builder;
import lombok.Data;

import java.time.Month;
import java.util.List;

@Data @Builder
public class LatestAndLastSongsDto {

    private List<Song> tjLatestSongs;
    private List<Song> tjLastSongs;
    private List<Song> kyLatestSongs;
    private List<Song> kyLastSongs;

    private Month tjLatestMonth;
    private Month tjLastMonth;
    private Month kyLatestMonth;
    private Month kyLastMonth;

}
