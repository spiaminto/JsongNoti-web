package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.auth.PrincipalDetails;
import com.jsongnoti.jsongnoti_web.controller.dto.SongMemoResponse;
import com.jsongnoti.jsongnoti_web.controller.form.memo.DeleteMemoForm;
import com.jsongnoti.jsongnoti_web.controller.form.memo.MemoAddForm;
import com.jsongnoti.jsongnoti_web.controller.form.memo.MemoSearchForm;
import com.jsongnoti.jsongnoti_web.controller.form.memo.ReorderForm;
import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.service.SongMemoService;
import com.jsongnoti.jsongnoti_web.service.dto.MemoSearchCond;
import com.jsongnoti.jsongnoti_web.service.dto.SongMemoServiceResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.naming.Binding;
import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
public class MemoController {

    private final SongMemoService songMemoService;

    @GetMapping("/memos")
    public ResponseEntity<SongMemoResponse> memos(@Validated @ModelAttribute MemoSearchForm memoSearchForm,
                                                  BindingResult bindingResult) {
        log.info("memoSearchForm: {}", memoSearchForm);
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(null);
        }

        SongMemoServiceResult result = songMemoService.searchMemos(new MemoSearchCond(memoSearchForm.getBrand(), memoSearchForm.getMemoPresentType()));
        return ResponseEntity.ok().body(SongMemoResponse.withMessageAndSongMemos(result.getMessage(), result.getSongMemos()));
    }

    @PostMapping("/memos")
    public ResponseEntity<SongMemoResponse> addMemo(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                                    @Validated @ModelAttribute(name = "memoAddForm") MemoAddForm memoAddForm,
                                                    BindingResult bindingResult) {
        log.info("addMemo: {}", memoAddForm);
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(SongMemoResponse.withMessage(bindingResult.getFieldError().getDefaultMessage()));
        }

//        if (!userId.equals(memoAddForm.getUserId())) {
//            return ResponseEntity.badRequest().body(SongMemoResponse.withMessage("잘못된 요청입니다."));
//        }

        //TODO 임시구현
//        Long userId = principalDetails.getUserId();
        Long userId = 47L;
        Long songId = memoAddForm.getSongId();
        int presentOrder = memoAddForm.getPresentOrder();

        SongMemoServiceResult result = songMemoService.saveMemo(userId, songId, memoAddForm.getInfoText(), presentOrder);
        if (!result.isSuccess()) {
            return ResponseEntity.status(409).body(SongMemoResponse.withMessage(result.getMessage()));
        }

        return ResponseEntity.ok(SongMemoResponse.withMessage(result.getMessage()));
    }

    @PostMapping("/memos/reorder")
    public ResponseEntity<String> switchOrder(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                              @ModelAttribute ReorderForm reorderForm) {

        log.info("switchOrder: {}", reorderForm);
//        Long userId = principalDetails.getUserId();

        // 로그인 된 유저인지 확인
//        if (userId.equals(reorderForm.getUserId())) {
//            return ResponseEntity.badRequest().body("잘못된 요청입니다.");
//        }

        Long userId = 47L;
        List<Long> memoIds = reorderForm.getMemoIds();
        Brand brand = reorderForm.getBrand();

        SongMemoServiceResult result = songMemoService.reorder(userId, memoIds, brand);
        int status = result.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status).body(result.getMessage());
    }

    @DeleteMapping("/memos/{memoId}")
    public ResponseEntity<String> deleteMemo(@PathVariable(name = "memoId") Long memoId,
                                             @AuthenticationPrincipal PrincipalDetails principalDetails,
                                             @ModelAttribute DeleteMemoForm deleteMemoForm) {
        log.info("deleteMemo: {}", deleteMemoForm);
//        Long userId = principalDetails.getUserId();
        Long userId = 47L;
        Long inputUserId = deleteMemoForm.getUserId();

        // 로그인 된 유저인지 확인
//        if (!userId.equals(inputUserId)) {
//            return ResponseEntity.badRequest().body("잘못된 요청입니다.");
//        }

        SongMemoServiceResult result = songMemoService.deleteMemo(userId, memoId);

        return ResponseEntity.ok(result.getMessage());
    }

}
