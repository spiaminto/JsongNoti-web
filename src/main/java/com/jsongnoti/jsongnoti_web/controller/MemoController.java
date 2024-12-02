package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.auth.PrincipalDetails;
import com.jsongnoti.jsongnoti_web.controller.form.memo.MemoAddForm;
import com.jsongnoti.jsongnoti_web.service.SongMemoService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequiredArgsConstructor
public class MemoController {

    private final SongMemoService songMemoService;

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

}
