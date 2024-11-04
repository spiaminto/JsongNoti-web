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

    /**
     * 홈페이지용 통합된 메서드
     * 오늘부터 세달간의 노래를 DB 조회후 이번달, 저번달 노래를 브랜드별로 필터링하여 한꺼번에 전달
     * @return Map keys = tjLatest, tjLast, kyLatest, kyLast
     */
    public LatestAndLastSongsDto getLatestAndLastSongs() {
        LocalDate today = LocalDate.now();
        LocalDate thisMonthFirstDate = LocalDate.of(today.getYear(), today.getMonth(), 1);
        LocalDate thisMonthLastDate = thisMonthFirstDate.plusMonths(1).minusDays(1);

        // 저저번달 1일 부터 이번달 말일 까지 조회
        LocalDate lastTwoMonthFirstDate = thisMonthFirstDate.minusMonths(2);
        List<Song> findSongs = songRepository.findSongsBetweenTime(lastTwoMonthFirstDate, thisMonthLastDate);

        // 브랜드별 분류
        Map<Boolean, List<Song>> partitionedByBrandEqualsTj = findSongs.stream()
                .collect(Collectors.partitioningBy(song -> Brand.TJ.equals(song.getBrand())));
        
        // TJ 시간별 분류
        Map<Month, List<Song>> tjGroupedByMonth = partitionedByBrandEqualsTj.get(true)
                .stream()
                .collect(Collectors.groupingBy(song -> song.getRegDate().getMonth()));

        // TJ 이번달 신곡 여부로 최근 달 설정
        Month tjLatestMonth = tjGroupedByMonth.get(today.getMonth()) != null ?
                today.getMonth() :
                today.minusMonths(1).getMonth();

        // KY 시간별 분류
        Map<Month, List<Song>> kyGroupedByMonth = partitionedByBrandEqualsTj.get(false).stream()
                .collect(Collectors.groupingBy(song -> song.getRegDate().getMonth()));

        // KY 이번달 신곡 여부로 최근 달 설정
        Month kyLatestMonth = kyGroupedByMonth.get(today.getMonth()) != null ?
                today.getMonth() :
                today.minusMonths(1).getMonth();

        // 결과
        return LatestAndLastSongsDto.builder()
                .tjLatestMonth(tjLatestMonth)
                .tjLatestSongs(tjGroupedByMonth.getOrDefault(tjLatestMonth, Collections.emptyList()))
                .tjLastMonth(tjLatestMonth.minus(1))
                .tjLastSongs(tjGroupedByMonth.getOrDefault(tjLatestMonth.minus(1), Collections.emptyList()))
                .kyLatestMonth(kyLatestMonth)
                .kyLatestSongs(kyGroupedByMonth.getOrDefault(kyLatestMonth, Collections.emptyList()))
                .kyLastMonth(kyLatestMonth.minus(1))
                .kyLastSongs(kyGroupedByMonth.getOrDefault(kyLatestMonth.minus(1), Collections.emptyList()))
                .build();
    }

}
