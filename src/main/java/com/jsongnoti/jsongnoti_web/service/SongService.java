package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.repository.SongWithKoreanDto;
import com.jsongnoti.jsongnoti_web.service.dto.LatestAndLastSongsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SongService {

    private final SongRepository songRepository;

    /**
     * 홈페이지용 통합된 메서드
     * 오늘부터 세달간의 노래를 DB 조회후 브랜드별 및 시간별(두 달)로 필터링하여 리턴
     *
     * @return LatestAndLastSongsDto
     */
    public LatestAndLastSongsDto getLatestAndLastSongs() {
        LocalDate today = LocalDate.now();
        LocalDate thisMonthFirstDate = LocalDate.of(today.getYear(), today.getMonth(), 1);
        LocalDate thisMonthLastDate = thisMonthFirstDate.plusMonths(1); // 어차피 0시 이하이므로 당일 포함x

        // 저저번달 1일 부터 이번달 말일 까지 조회 (order by regdate desc)
        LocalDate lastTwoMonthFirstDate = thisMonthFirstDate.minusMonths(2);
        List<SongWithKoreanDto> findSongs = songRepository.findSongsBetweenTime(lastTwoMonthFirstDate, thisMonthLastDate);

        // 브랜드별 분류
        Map<Brand, List<SongWithKoreanDto>> songs = findSongs.stream()
                .collect(Collectors.groupingBy(SongWithKoreanDto::getBrand));
        List<SongWithKoreanDto> tjSongs = songs.get(Brand.TJ);
        List<SongWithKoreanDto> kySongs = songs.get(Brand.KY);

        // 당일(now) 로 미리 초기화.
        LocalDate tjLatestDate = LocalDate.now();
        LocalDate kyLatestDate = LocalDate.now();
        Month tjLatestMonth = tjLatestDate.getMonth();
        Month tjLastMonth = tjLatestMonth.minus(1);
        Month kyLatestMonth = kyLatestDate.getMonth();
        Month kyLastMonth = kyLatestMonth.minus(1);
        List<SongWithKoreanDto> tjLatestMonthSongs = new ArrayList<>();
        List<SongWithKoreanDto> kyLatestMonthSongs = new ArrayList<>();
        List<SongWithKoreanDto> tjLastMonthSongs = new ArrayList<>();
        List<SongWithKoreanDto> kyLastMonthSongs = new ArrayList<>();

        if (!tjSongs.isEmpty()) { // 조건 날짜에 맞는 곡 존재
            tjLatestDate = tjSongs.get(0).getRegDate();
            // 이번달
            tjLatestMonth = tjLatestDate.getMonth();
            int tjLatestMonthValue = tjLatestMonth.get(ChronoField.MONTH_OF_YEAR);
            tjLatestMonthSongs = tjSongs.stream().filter(song -> song.getRegDate().getMonth().get(ChronoField.MONTH_OF_YEAR) == tjLatestMonthValue).toList();
            // 저번달
            tjLastMonth = tjLatestMonth.minus(1);
            int tjLastMonthValue = tjLastMonth.get(ChronoField.MONTH_OF_YEAR);
            tjLastMonthSongs = tjSongs.stream().filter(song -> song.getRegDate().getMonth().get(ChronoField.MONTH_OF_YEAR) == tjLastMonthValue).toList();
        }

        if (!kySongs.isEmpty()) {
            kyLatestDate = kySongs.get(0).getRegDate();
            // 이번달
            kyLatestMonth = kyLatestDate.getMonth();
            int kyLatestMonthValue = kyLatestMonth.get(ChronoField.MONTH_OF_YEAR);
            kyLatestMonthSongs = kySongs.stream().filter(song -> song.getRegDate().getMonth().get(ChronoField.MONTH_OF_YEAR) == kyLatestMonthValue).toList();
            // 저번달
            kyLastMonth = kyLatestMonth.minus(1);
            int kyLastMonthValue = kyLastMonth.get(ChronoField.MONTH_OF_YEAR);
            kyLastMonthSongs = kySongs.stream().filter(song -> song.getRegDate().getMonth().get(ChronoField.MONTH_OF_YEAR) == kyLastMonthValue).toList();
        }

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

}
