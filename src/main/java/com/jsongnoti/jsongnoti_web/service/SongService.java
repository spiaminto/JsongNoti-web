package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SongService {

    private final SongRepository songRepository;

    /**
     * 홈페이지용 통합된 메서드
     * 오늘부터 세달간의 노래를 DB 조회후 브랜드별 및 시간별(두 달)로 필터링하여 리턴
     * @return LatestAndLastSongsDto
     */
    public LatestAndLastSongsDto getLatestAndLastSongs() {
        LocalDate today = LocalDate.now();
        LocalDate thisMonthFirstDate = LocalDate.of(today.getYear(), today.getMonth(), 1);
        LocalDate thisMonthLastDate = thisMonthFirstDate.plusMonths(1).minusDays(1);

        // 저저번달 1일 부터 이번달 말일 까지 조회 (order by regdate desc)
        LocalDate lastTwoMonthFirstDate = thisMonthFirstDate.minusMonths(2);
        List<Song> findSongs = songRepository.findSongsBetweenTime(lastTwoMonthFirstDate, thisMonthLastDate);

        // 브랜드별 분류
        Map<Brand, List<Song>> songs = findSongs.stream()
                .collect(Collectors.groupingBy(Song::getBrand));

        // TJ 가장 최근곡 기준으로 날짜별 필터링 (아무 곡도 없을경우 오류남!)
        Song tjLatestSong = songs.get(Brand.TJ).get(0);
        LocalDate tjLatestDate = tjLatestSong.getRegDate();

        Month tjLatestMonth = tjLatestSong.getRegDate().getMonth();
        List<Song> tjLatestMonthSongs = songs.get(Brand.TJ).stream().filter(song -> song.getRegDate().getMonth().equals(tjLatestMonth)).toList();

        Month tjLastMonth = tjLatestMonth.minus(1);
        List<Song> tjLastMonthSongs = songs.get(Brand.TJ).stream().filter(song -> song.getRegDate().getMonth().equals(tjLastMonth)).toList();

        // KY 가장 최근곡 기준으로 날짜별 필터링 (아무 곡도 없을경우 오류남!)
        Song kyLatestSong = songs.get(Brand.KY).get(0);
        LocalDate kyLatestDate = kyLatestSong.getRegDate();

        Month kyLatestMonth = kyLatestSong.getRegDate().getMonth();
        List<Song> kyLatestMonthSongs = songs.get(Brand.KY).stream().filter(song -> song.getRegDate().getMonth().equals(kyLatestMonth)).toList();

        Month kyLastMonth = kyLatestMonth.minus(1);
        List<Song> kyLastMonthSongs = songs.get(Brand.KY).stream().filter(song -> song.getRegDate().getMonth().equals(kyLastMonth)).toList();

        return LatestAndLastSongsDto.builder()
                .tjLatestMonthSongs(tjLatestMonthSongs)
                .tjLastMonthSongs(tjLastMonthSongs)
                .kyLatestMonthSongs(kyLatestMonthSongs)
                .kyLastMonthSongs(kyLastMonthSongs)

                .tjLatestDate(tjLatestDate)
                .kyLatestDate(kyLatestDate)
                .tjLatestMonth(tjLatestMonth)
                .tjLastMonth(tjLastMonth)
                .kyLatestMonth(kyLatestMonth)
                .kyLastMonth(kyLastMonth)
                .build();
    }

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
            tjSongs = songRepository.findSongsByBrandBetweenTime(Brand.TJ, startDate.minusMonths(1), endDate.minusMonths(1));
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
            kySongs = songRepository.findSongsByBrandBetweenTime(Brand.KY, startDate.minusMonths(1), endDate.minusMonths(1));
        }

//        log.info("\n[SongService.getRecentKySongsByMonth()] kySongs = {}", kySongs);
        return kySongs;
    }

}
