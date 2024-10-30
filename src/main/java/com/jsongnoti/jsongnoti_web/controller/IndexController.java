package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
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

        log.info("index");
        LocalDate now = LocalDate.now();
        LocalDate startDate = LocalDate.of(now.getYear(), now.getMonth(), 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);
        String tjMonth = "";
        String kyMonth = "";

        // TJ 신곡 조회
        List<Song> tjSongs = songService.getRecentTjSongsByMonth();
        if (!tjSongs.isEmpty()) tjMonth = tjSongs.get(0).getRegDate().getMonth().getDisplayName(TextStyle.FULL, Locale.KOREAN);
        log.info("\n[IndexController.index()] tjMonth = {} tjSongs = {}", tjMonth, tjSongs);
        List<NewSongDto> tjNewSongs = tjSongs.stream().map(NewSongDto::fromSong).toList();

        // KY 신곡 조회
        List<Song> kySongs = songService.getRecentKySongsByMonth();
        if (!kySongs.isEmpty()) kyMonth = kySongs.get(0).getRegDate().getMonth().getDisplayName(TextStyle.FULL, Locale.KOREAN);
        log.info("\n[IndexController.index()] kyMonth = {} kySongs = {}", kyMonth, kySongs);
        List<NewSongDto> kyNewSongs = kySongs.stream().map(NewSongDto::fromSong).toList();
        
        model.addAttribute("tjNewSongs", tjNewSongs);
        model.addAttribute("kyNewSongs", kyNewSongs);
        model.addAttribute("tjMonth", tjMonth);
        model.addAttribute("kyMonth", kyMonth);
        return "index";
    }



}
