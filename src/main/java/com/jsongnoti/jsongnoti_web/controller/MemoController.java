package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.auth.PrincipalDetails;
import com.jsongnoti.jsongnoti_web.controller.form.memo.MemoAddForm;
import com.jsongnoti.jsongnoti_web.controller.form.memo.MemoSearchForm;
import com.jsongnoti.jsongnoti_web.controller.form.memo.SwitchOrderForm;
import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.SongMemo;
import com.jsongnoti.jsongnoti_web.service.SongMemoService;
import com.jsongnoti.jsongnoti_web.service.dto.MemoSearchCond;
import jakarta.transaction.Transactional;
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
public class MemoController {

    private final SongMemoService songMemoService;

    @GetMapping("/memos")
    public ResponseEntity<List<SongMemo>> memos(@Validated @ModelAttribute MemoSearchForm memoSearchForm,
                                                BindingResult bindingResult) {
        log.info("memoSearchForm: {}", memoSearchForm);
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(null);
        }

        List<SongMemo> songMemos = songMemoService.searchMemos(new MemoSearchCond(memoSearchForm.getBrand(), memoSearchForm.getPresentType()));
        return ResponseEntity.ok().body(songMemos);
    }

    @PostMapping("/memos")
    public ResponseEntity<String> addMemo(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                          @Validated  @ModelAttribute(name = "memoAddForm") MemoAddForm memoAddForm,
                                          BindingResult bindingResult) {
        log.info("addMemo: {}", memoAddForm);
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(bindingResult.getFieldError().getDefaultMessage());
        }

        //TODO 임시구현
//        Long userId = principalDetails.getUserId();
        Long userId = 47L;
        Long songId = memoAddForm.getSongId();
        int presentOrder = memoAddForm.getPresentOrder();

        songMemoService.saveMemo(userId, songId, memoAddForm.getInfoText(), presentOrder);

        return ResponseEntity.ok("저장되었음.");
    }

    @PatchMapping("/memos/switch-order")
    public ResponseEntity<String> switchOrder(@AuthenticationPrincipal PrincipalDetails principalDetails,
                                              @ModelAttribute SwitchOrderForm switchOrderForm) {
        log.info("switchOrder: {}", switchOrderForm);
//        Long userId = principalDetails.getUserId();
        Long userId = 47L;
        List<Integer> songNumbers = switchOrderForm.getNumbers();
        Brand brand = switchOrderForm.getBrand();

        songMemoService.switchOrder(userId, songNumbers, brand);


        return ResponseEntity.ok("순서 변경됨");
    }

}
