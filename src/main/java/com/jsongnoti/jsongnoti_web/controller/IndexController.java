package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.auth.PrincipalDetails;
import com.jsongnoti.jsongnoti_web.controller.dto.NewSongDto;
import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.service.SongService;
import com.jsongnoti.jsongnoti_web.service.UserService;
import com.jsongnoti.jsongnoti_web.service.dto.LatestAndLastSongsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@Slf4j
@Controller
@RequiredArgsConstructor
public class IndexController {

    private final SongService songService;
    private final UserService userService;

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


    @GetMapping("/search")
    public String search() {
        return "search";
    }

    @GetMapping("/login")
    public String login(RedirectAttributes redirectAttributes) {
        redirectAttributes.addFlashAttribute("alertMessage", "로그인이 필요합니다.");
        return "redirect:/";
    }

    @GetMapping("/memo")
    public String memo(@AuthenticationPrincipal PrincipalDetails principalDetails,
                       Model model) {
        if (principalDetails == null || principalDetails.getUserId() == null) {
            return "redirect:/oauth2/authorization/google";
        }

        Long userId = principalDetails.getUserId();
        User user = userService.findUserById(userId);
        model.addAttribute("userId", userId);
        model.addAttribute("username", user.getUsername());
        model.addAttribute("memoPresentType", user.getMemoPresentType());
        model.addAttribute("showMemoBrand", user.getShowMemoBrand());

        return "memo";
    }

    @GetMapping("/privacy-policy")
    public String privacyPolicy(@RequestParam(value = "date", required = false) String date) {
        log.info("date: {}", date);
        if (date == null) { date = "241220"; }
        return "/privacy-policy/" + date;
    }

    @GetMapping("/terms-of-use")
    public String termsOfUse(@RequestParam(value = "date", required = false) String date) {
        log.info("date: {}", date);
        if (date == null) { date = "241220"; }
        return "/terms-of-use/" + date;
    }

}
