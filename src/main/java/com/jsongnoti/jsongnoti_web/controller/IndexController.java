package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.service.LatestAndLastSongsDto;
import com.jsongnoti.jsongnoti_web.service.SongService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@Slf4j
@Controller
@RequiredArgsConstructor
public class IndexController {

    private final SongService songService;

    @GetMapping("/health-check")
    @ResponseBody
    public ResponseEntity<String> awsHealthCheck() {
        return ResponseEntity.ok("health-check");
    }

    @GetMapping("/")
    public String index(Model model) {
        LatestAndLastSongsDto latestAndLastSongs = songService.getLatestAndLastSongs();

        // 태진 dto 매핑
        LocalDate tjLatestDate = latestAndLastSongs.getTjLatestDate();
        String tjLatestDateStr = tjLatestDate.getMonth().getValue() + "/" + tjLatestDate.getDayOfMonth() + "(" + tjLatestDate.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.KOREA) + ")";

        String tjLatestMonth = latestAndLastSongs.getTjLatestMonth().getDisplayName(TextStyle.FULL, Locale.KOREA);
        List<NewSongDto> tjLatestMonthSongs = latestAndLastSongs.getTjLatestMonthSongs().stream().map(song -> NewSongDto.fromSongWithLatest(song, tjLatestDate)).toList();
        String tjLastMonth = latestAndLastSongs.getTjLastMonth().getDisplayName(TextStyle.FULL, Locale.KOREA);
        List<NewSongDto> tjLastMonthSongs = latestAndLastSongs.getTjLastMonthSongs().stream().map(NewSongDto::fromSong).toList();

        // 금영 dto 매핑
        LocalDate kyLatestDate = latestAndLastSongs.getKyLatestDate();
        String kyLatestDateStr = kyLatestDate.getMonth().getValue() + "/" + kyLatestDate.getDayOfMonth() + "(" + kyLatestDate.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.KOREA) + ")";

        String kyLatestMonth = latestAndLastSongs.getKyLatestMonth().getDisplayName(TextStyle.FULL, Locale.KOREA);
        List<NewSongDto> kyLatestMonthSongs = latestAndLastSongs.getKyLatestMonthSongs().stream().map(song -> NewSongDto.fromSongWithLatest(song, kyLatestDate)).toList();
        String kyLastMonth = latestAndLastSongs.getKyLastMonth().getDisplayName(TextStyle.FULL, Locale.KOREA);
        List<NewSongDto> kyLastMonthSongs = latestAndLastSongs.getKyLastMonthSongs().stream().map(NewSongDto::fromSong).toList();

        // 모델 매핑
        model.addAttribute("tjLatestDateStr", tjLatestDateStr);
        model.addAttribute("kyLatestDateStr", kyLatestDateStr);

        model.addAttribute("tjLatestMonth", tjLatestMonth);
        model.addAttribute("tjLatestMonthSongs", tjLatestMonthSongs);
        model.addAttribute("tjLastMonth", tjLastMonth);
        model.addAttribute("tjLastMonthSongs", tjLastMonthSongs);

        model.addAttribute("kyLatestMonth", kyLatestMonth);
        model.addAttribute("kyLatestMonthSongs", kyLatestMonthSongs);
        model.addAttribute("kyLastMonth", kyLastMonth);
        model.addAttribute("kyLastMonthSongs", kyLastMonthSongs);

        return "index";
    }

    @GetMapping("/privacy-policy")
    public String privacyPolicy() {
        return "privacy-policy";
    }



}
