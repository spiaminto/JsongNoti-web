package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.auth.PrincipalDetails;
import com.jsongnoti.jsongnoti_web.controller.dto.FavoriteSongResponse;
import com.jsongnoti.jsongnoti_web.controller.form.favorite.FavoriteSongAddRequest;
import com.jsongnoti.jsongnoti_web.controller.form.favorite.FavoriteSongDeleteRequest;
import com.jsongnoti.jsongnoti_web.controller.form.favorite.FavoriteSongSearchRequest;
import com.jsongnoti.jsongnoti_web.controller.form.favorite.FavoriteSongsReorderRequest;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.service.FavoriteSongService;
import com.jsongnoti.jsongnoti_web.service.dto.FavoriteSongSearchCond;
import com.jsongnoti.jsongnoti_web.service.result.FavoriteSongServiceResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
public class FavoriteSongController {

    private final FavoriteSongService favoriteSongService;

    @GetMapping("/favorite-songs")
    public ResponseEntity<FavoriteSongResponse> favoriteSongs(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                                              @Valid @ModelAttribute FavoriteSongSearchRequest favoriteSongSearchRequest) {
        log.info("favoriteSongSearchRequest: {}", favoriteSongSearchRequest);
        Long userId = favoriteSongSearchRequest.getUserId();
        // 폼 userId 값 검증
        if (!userId.equals(principalDetails.getMemberId())) {
            return ResponseEntity.badRequest().body(FavoriteSongResponse.withMessage("잘못된 애창곡 요청입니다."));
        }

        FavoriteSongServiceResult result = favoriteSongService.searchFavoriteSongs(new FavoriteSongSearchCond(favoriteSongSearchRequest.getUserId(), favoriteSongSearchRequest.getBrand(), favoriteSongSearchRequest.getFavoriteSongPresentType()));
        return ResponseEntity.ok().body(FavoriteSongResponse.builder()
                .favoriteSongs(result.getFavoriteSongs()).message(result.getMessage()).build());
    }

    @PostMapping("/favorite-songs")
    public ResponseEntity<FavoriteSongResponse> addFavoriteSongs(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                                                 @Validated @RequestBody FavoriteSongAddRequest favoriteSongAddRequest) {
        log.info("favoriteSongAddRequest: {}", favoriteSongAddRequest);
        Long userId = favoriteSongAddRequest.getUserId();
        // 폼 userId 값 검증
        if (!userId.equals(principalDetails.getMemberId())) {
            return ResponseEntity.badRequest().body(FavoriteSongResponse.withMessage("잘못된 추가 요청입니다."));
        }

        Long songId = favoriteSongAddRequest.getSongId();
        int presentOrder = favoriteSongAddRequest.getPresentOrder();
        boolean useDefaultInfoText = favoriteSongAddRequest.isUseDefaultInfoText();

        FavoriteSongServiceResult result = favoriteSongService.saveFavoriteSong(userId, songId, favoriteSongAddRequest.getInfoText(), presentOrder, useDefaultInfoText);
        int status = result.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status).body(FavoriteSongResponse.withMessage(result.getMessage()));
    }

    @PostMapping("/favorite-songs/reorder")
    public ResponseEntity<FavoriteSongResponse> reorder(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                                        @Validated @RequestBody FavoriteSongsReorderRequest favoriteSongsReorderRequest) {
        log.info("switchOrder: {}", favoriteSongsReorderRequest);
        Long userId = favoriteSongsReorderRequest.getUserId();
        // 폼 userId 값 검증
        if (!userId.equals(principalDetails.getMemberId())) {
            return ResponseEntity.badRequest().body(FavoriteSongResponse.withMessage("잘못된 순서변경 요청입니다."));
        }

        List<Long> favoriteSongIds = favoriteSongsReorderRequest.getFavoriteSongIds();
        Brand brand = favoriteSongsReorderRequest.getBrand();

        FavoriteSongServiceResult result = favoriteSongService.reorder(userId, favoriteSongIds, brand);
        int status = result.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status).body(FavoriteSongResponse.withMessage(result.getMessage()));
    }

    @DeleteMapping("/favorite-songs/{favoriteSongId}")
    public ResponseEntity<FavoriteSongResponse> deleteFavoriteSong(@PathVariable(name = "favoriteSongId") Long favoriteSongId,
                                                                   @AuthenticationPrincipal PrincipalDetails principalDetails,
                                                                   @Validated @RequestBody FavoriteSongDeleteRequest favoriteSongDeleteRequest) {
        log.info("deleteFavoriteSong: {}", favoriteSongDeleteRequest);
        Long userId = favoriteSongDeleteRequest.getUserId();
        // 폼 userId 값 검증
        if (!userId.equals(principalDetails.getMemberId())) {
            return ResponseEntity.badRequest().body(FavoriteSongResponse.withMessage("잘못된 메모삭제 요청입니다."));
        }

        FavoriteSongServiceResult result = favoriteSongService.deleteFavoriteSong(userId, favoriteSongId);
        int status = result.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status).body(FavoriteSongResponse.withMessage(result.getMessage()));
    }

}
