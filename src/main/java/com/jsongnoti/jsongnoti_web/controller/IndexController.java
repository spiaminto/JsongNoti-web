package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
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
import java.util.Map;

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

        List<NewSongDto> tjLatestSongs = latestAndLastSongs.getTjLatestSongs().stream().map(NewSongDto::fromSong).toList();
        String tjLatestMonth = latestAndLastSongs.getTjLatestMonth().getDisplayName(TextStyle.FULL, Locale.KOREA);
        log.info("\n[IndexController.index()] tjMonth = {} tjSongs = {}", tjLatestMonth, tjLatestSongs);
        List<NewSongDto> tjLastSongs = latestAndLastSongs.getTjLastSongs().stream().map(NewSongDto::fromSong).toList();
        String tjLastMonth = latestAndLastSongs.getTjLastMonth().getDisplayName(TextStyle.FULL, Locale.KOREA);
        log.info("\n[IndexController.index()] tjMonth = {} tjSongs = {}", tjLastMonth, tjLastSongs);
        List<NewSongDto> kyLatestSongs = latestAndLastSongs.getKyLatestSongs().stream().map(NewSongDto::fromSong).toList();
        String kyLatestMonth = latestAndLastSongs.getKyLatestMonth().getDisplayName(TextStyle.FULL, Locale.KOREA);
        log.info("\n[IndexController.index()] tjMonth = {} tjSongs = {}", kyLatestMonth, kyLatestSongs);
        List<NewSongDto> kyLastSongs = latestAndLastSongs.getKyLastSongs().stream().map(NewSongDto::fromSong).toList();
        String kyLastMonth = latestAndLastSongs.getKyLastMonth().getDisplayName(TextStyle.FULL, Locale.KOREA);
        log.info("\n[IndexController.index()] tjMonth = {} tjSongs = {}", kyLastMonth, kyLastSongs);

        model.addAttribute("tjLatestMonth", tjLatestMonth);
        model.addAttribute("tjLatestSongs", tjLatestSongs);

        model.addAttribute("tjLastMonth", tjLastMonth);
        model.addAttribute("tjLastSongs", tjLastSongs);

        model.addAttribute("kyLatestMonth", kyLatestMonth);
        model.addAttribute("kyLatestSongs", kyLatestSongs);

        model.addAttribute("kyLastMonth", kyLastMonth);
        model.addAttribute("kyLastSongs", kyLastSongs);

        return "index";
    }



}
