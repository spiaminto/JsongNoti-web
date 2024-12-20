package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.auth.PrincipalDetails;
import com.jsongnoti.jsongnoti_web.controller.dto.SongMemoResponse;
import com.jsongnoti.jsongnoti_web.controller.form.memo.SongMemoAddRequest;
import com.jsongnoti.jsongnoti_web.controller.form.memo.SongMemoDeleteRequest;
import com.jsongnoti.jsongnoti_web.controller.form.memo.SongMemoSearchRequest;
import com.jsongnoti.jsongnoti_web.controller.form.memo.SongMemosReorderRequest;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.service.SongMemoService;
import com.jsongnoti.jsongnoti_web.service.dto.MemoSearchCond;
import com.jsongnoti.jsongnoti_web.service.result.SongMemoServiceResult;
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
public class SongMemoController {

    private final SongMemoService songMemoService;

    @GetMapping("/memos")
    public ResponseEntity<SongMemoResponse> memos(@Valid @ModelAttribute SongMemoSearchRequest songMemoSearchRequest) {
        log.info("memoSearchForm: {}", songMemoSearchRequest);

        SongMemoServiceResult result = songMemoService.searchMemos(new MemoSearchCond(songMemoSearchRequest.getUserId(), songMemoSearchRequest.getBrand(), songMemoSearchRequest.getMemoPresentType()));
        return ResponseEntity.ok().body(SongMemoResponse.builder()
                .songMemos(result.getSongMemos()).message(result.getMessage()).build());
    }

    @PostMapping("/memos")
    public ResponseEntity<SongMemoResponse> addMemo(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                                    @Validated @RequestBody SongMemoAddRequest songMemoAddRequest) {
        log.info("addMemo: {}", songMemoAddRequest);
        Long userId = songMemoAddRequest.getUserId();
        // 폼 userId 값 검증
        if (!userId.equals(principalDetails.getUserId())) {
            return ResponseEntity.badRequest().body(SongMemoResponse.withMessage("잘못된 메모추가 요청입니다."));
        }
        
        Long songId = songMemoAddRequest.getSongId();
        int presentOrder = songMemoAddRequest.getPresentOrder();

        SongMemoServiceResult result = songMemoService.saveMemo(userId, songId, songMemoAddRequest.getInfoText(), presentOrder);
        int status = result.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status).body(SongMemoResponse.withMessage(result.getMessage()));
    }

    @PostMapping("/memos/reorder")
    public ResponseEntity<SongMemoResponse> reorder(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                                    @Validated @RequestBody SongMemosReorderRequest songMemosReorderRequest) {
        log.info("switchOrder: {}", songMemosReorderRequest);
        Long userId = songMemosReorderRequest.getUserId();
        // 폼 userId 값 검증
        if (!userId.equals(principalDetails.getUserId())) {
            return ResponseEntity.badRequest().body(SongMemoResponse.withMessage("잘못된 순서변경 요청입니다."));
        }

        List<Long> memoIds = songMemosReorderRequest.getMemoIds();
        Brand brand = songMemosReorderRequest.getBrand();

        SongMemoServiceResult result = songMemoService.reorder(userId, memoIds, brand);
        int status = result.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status).body(SongMemoResponse.withMessage(result.getMessage()));
    }

    @DeleteMapping("/memos/{memoId}")
    public ResponseEntity<SongMemoResponse> deleteMemo(@PathVariable(name = "memoId") Long memoId,
                                             @AuthenticationPrincipal PrincipalDetails principalDetails,
                                             @Validated @RequestBody SongMemoDeleteRequest songMemoDeleteRequest) {
        log.info("deleteMemo: {}", songMemoDeleteRequest);
        Long userId = songMemoDeleteRequest.getUserId();
        // 폼 userId 값 검증
        if (!userId.equals(principalDetails.getUserId())) {
            return ResponseEntity.badRequest().body(SongMemoResponse.withMessage("잘못된 메모삭제 요청입니다."));
        }

        SongMemoServiceResult result = songMemoService.deleteMemo(userId, memoId);
        int status = result.isSuccess() ? 200 : 409;
        
        return ResponseEntity.status(status).body(SongMemoResponse.withMessage(result.getMessage()));
    }

}
