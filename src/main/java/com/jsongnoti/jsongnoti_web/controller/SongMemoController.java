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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
public class SongMemoController {

    private final SongMemoService songMemoService;

    @GetMapping("/memos")
    public ResponseEntity<SongMemoResponse> memos(@ModelAttribute SongMemoSearchRequest songMemoSearchRequest,
                                                  BindingResult bindingResult) {
        log.info("memoSearchForm: {}", songMemoSearchRequest);
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(null);
        }

        SongMemoServiceResult result = songMemoService.searchMemos(new MemoSearchCond(songMemoSearchRequest.getBrand(), songMemoSearchRequest.getMemoPresentType()));
        return ResponseEntity.ok().body(SongMemoResponse.builder()
                .songMemos(result.getSongMemos()).message(result.getMessage()).build());
    }

    @PostMapping("/memos")
    public ResponseEntity<SongMemoResponse> addMemo(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                                    @Validated @RequestBody SongMemoAddRequest songMemoAddRequest,
                                                    BindingResult bindingResult) {
        log.info("addMemo: {}", songMemoAddRequest);
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(SongMemoResponse.withMessage(bindingResult.getFieldError().getDefaultMessage()));
        }

//        if (!userId.equals(memoAddForm.getUserId())) {
//            return ResponseEntity.badRequest().body(SongMemoResponse.withMessage("잘못된 요청입니다."));
//        }

        //TODO 임시구현
//        Long userId = principalDetails.getUserId();
        Long userId = 47L;
        Long songId = songMemoAddRequest.getSongId();
        int presentOrder = songMemoAddRequest.getPresentOrder();

        SongMemoServiceResult result = songMemoService.saveMemo(userId, songId, songMemoAddRequest.getInfoText(), presentOrder);
        if (!result.isSuccess()) {
            return ResponseEntity.status(409).body(SongMemoResponse.withMessage(result.getMessage()));
        }

        return ResponseEntity.ok(SongMemoResponse.withMessage(result.getMessage()));
    }

    @PostMapping("/memos/reorder")
    public ResponseEntity<SongMemoResponse> reorder(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                                    @RequestBody SongMemosReorderRequest songMemosReorderRequest) {

        log.info("switchOrder: {}", songMemosReorderRequest);
//        Long userId = principalDetails.getUserId();

        // 로그인 된 유저인지 확인
//        if (userId.equals(reorderForm.getUserId())) {
//            return ResponseEntity.badRequest().body("잘못된 요청입니다.");
//        }

        Long userId = 47L;
        List<Long> memoIds = songMemosReorderRequest.getMemoIds();
        Brand brand = songMemosReorderRequest.getBrand();

        SongMemoServiceResult result = songMemoService.reorder(userId, memoIds, brand);
        int status = result.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status).body(SongMemoResponse.withMessage(result.getMessage()));
    }

    @DeleteMapping("/memos/{memoId}")
    public ResponseEntity<SongMemoResponse> deleteMemo(@PathVariable(name = "memoId") Long memoId,
                                             @AuthenticationPrincipal PrincipalDetails principalDetails,
                                             @RequestBody SongMemoDeleteRequest songMemoDeleteRequest) {
        log.info("deleteMemo: {}", songMemoDeleteRequest);
//        Long userId = principalDetails.getUserId();
        Long userId = 47L;
        Long inputUserId = songMemoDeleteRequest.getUserId();

        // 로그인 된 유저인지 확인
//        if (!userId.equals(inputUserId)) {
//            return ResponseEntity.badRequest().body("잘못된 요청입니다.");
//        }

        SongMemoServiceResult result = songMemoService.deleteMemo(userId, memoId);

        return ResponseEntity.ok(SongMemoResponse.withMessage(result.getMessage()));
    }

}
