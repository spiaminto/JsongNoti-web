package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SongService {

    private final SongRepository songRepository;

    /**
     * 최근 1달간의 TJ 노래 목록을 조회한다. 만약 조회된 노래가 없다면 1달 전의 노래 목록을 조회한다.
     * @return
     */
    public List<Song> getRecentTjSongsByMonth() {
        List<Song> tjSongs = new ArrayList<>();
        LocalDate now = LocalDate.now();
        LocalDate startDate = LocalDate.of(now.getYear(), now.getMonth(), 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        tjSongs = songRepository.findSongsByBrandBetweenTime(Brand.TJ, startDate, endDate);
        if (tjSongs.isEmpty()) {
            songRepository.findSongsByBrandBetweenTime(Brand.TJ, startDate.minusMonths(1), endDate.minusMonths(1));
        }

//        log.info("\n[SongService.getRecentTjSongsByMonth()] tjSongs = {}", tjSongs);
        return tjSongs;
    }

    /**
     * 최근 1달간의 KY 노래 목록을 조회한다. 만약 조회된 노래가 없다면 1달 전의 노래 목록을 조회한다.
     * @return
     */
    public List<Song> getRecentKySongsByMonth() {
        List<Song> kySongs = new ArrayList<>();
        LocalDate now = LocalDate.now();
        LocalDate startDate = LocalDate.of(now.getYear(), now.getMonth(), 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        kySongs = songRepository.findSongsByBrandBetweenTime(Brand.KY, startDate, endDate);
        if (kySongs.isEmpty()) {
            songRepository.findSongsByBrandBetweenTime(Brand.KY, startDate.minusMonths(1), endDate.minusMonths(1));
        }

//        log.info("\n[SongService.getRecentKySongsByMonth()] kySongs = {}", kySongs);
        return kySongs;
    }

}
