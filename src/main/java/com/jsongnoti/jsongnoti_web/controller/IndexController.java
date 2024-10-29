package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Controller
@RequiredArgsConstructor
public class IndexController {

    private final SongRepository songRepository;

    @GetMapping("/")
    public String index(Model model) {

        log.info("index");
        List<Song> tjSongs = songRepository.findLatestSongsByBrand(Brand.TJ);
        log.info("tjSongs = {}", tjSongs);
        List<Song> kySongs = songRepository.findLatestSongsByBrand(Brand.KY);
        log.info("kySongs = {}", kySongs);
        String formattedTjDate = !tjSongs.isEmpty() ?
                DateTimeFormatter.ofPattern("yyyy-MM-dd").format(tjSongs.get(0).getCreatedAt()) :
                "";
        String formattedKyDate = !kySongs.isEmpty() ?
                DateTimeFormatter.ofPattern("yyyy-MM-dd").format(kySongs.get(0).getCreatedAt()) :
                "";
        List<NewSongDto> tjNewSongs = tjSongs.stream().map(NewSongDto::fromSong).toList();
        List<NewSongDto> kyNewSongs = kySongs.stream().map(NewSongDto::fromSong).toList();
        model.addAttribute("tjNewSongs", tjNewSongs);
        model.addAttribute("kyNewSongs", kyNewSongs);
        model.addAttribute("tjDate", formattedTjDate);
        model.addAttribute("kyDate", formattedKyDate);
        return "index";
    }



}
