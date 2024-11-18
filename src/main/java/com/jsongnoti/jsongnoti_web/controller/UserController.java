package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.*;
import com.jsongnoti.jsongnoti_web.service.ResultDto;
import com.jsongnoti.jsongnoti_web.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Controller
@Slf4j
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<ResponseDto> addUser(@Validated @ModelAttribute SubscriptionForm subscriptionForm,
                                               BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ResponseDto.builder().message(bindingResult.getFieldError().getDefaultMessage()).build());
        }

        log.info("email: {}", subscriptionForm.getEmail());
        String email = subscriptionForm.getEmail();

        ResultDto resultDto = userService.addUser(email);

        return resultDto.isHasError() ? // 검증오류시 409 conflict
                ResponseEntity.status(409).body(ResponseDto.builder().message(resultDto.getMessage()).build()) :
                ResponseEntity.ok().body(ResponseDto.builder()
                        .userId(resultDto.getUserId()).message(resultDto.getMessage()).build());
    }

    @PostMapping("/users/{userId}/verify-add")
    public ResponseEntity<ResponseDto> verifyAddUser(@PathVariable(name = "userId") Long userId,
                                                     @Validated @ModelAttribute VerifyEmailForm verifyEmailForm,
                                                     BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ResponseDto.builder().message(bindingResult.getFieldError().getDefaultMessage()).build());
        }

        String authenticationToken = verifyEmailForm.getCode();
        log.info("userId: {}, token: {}", userId, authenticationToken);

        ResultDto resultDto = userService.verifyAddUser(userId, authenticationToken);

        return resultDto.isHasError() ? // 검증오류시 409 conflict
                ResponseEntity.status(409).body(ResponseDto.builder().message(resultDto.getMessage()).build()) :
                ResponseEntity.ok().body(ResponseDto.builder().message(resultDto.getMessage()).build());
    }

    @PostMapping("/users/delete")
    public ResponseEntity<ResponseDto> deleteUser(@Validated @ModelAttribute UnSubscriptionForm unSubscriptionForm,
                                                  BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ResponseDto.builder().message(bindingResult.getFieldError().getDefaultMessage()).build());
        }

        String email = unSubscriptionForm.getEmail();
        log.info("email: {}", email);

        ResultDto resultDto = userService.deleteUser(email);

        return resultDto.isHasError() ? // 검증오류시 409 conflict
                ResponseEntity.status(409).body(ResponseDto.builder().message(resultDto.getMessage()).build()) :
                ResponseEntity.ok().body(ResponseDto.builder()
                        .userId(resultDto.getUserId()).message(resultDto.getMessage()).build());
    }

    @PostMapping("/users/{userId}/verify-delete")
    public ResponseEntity<ResponseDto> verifyDeleteUser(@PathVariable(name = "userId") Long userId,
                                                        @Validated @ModelAttribute ConfirmDeleteForm confirmDeleteForm,
                                                        BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ResponseDto.builder().message(bindingResult.getFieldError().getDefaultMessage()).build());
        }

        String authenticationToken = confirmDeleteForm.getCode();
        log.info("userId: {}, token: {}", userId, authenticationToken);

        ResultDto resultDto = userService.verifyDeleteUser(userId, authenticationToken);

        return resultDto.isHasError() ? // 검증오류시 409 conflict
                ResponseEntity.status(409).body(ResponseDto.builder().message(resultDto.getMessage()).build()) :
                ResponseEntity.ok().body(ResponseDto.builder().message(resultDto.getMessage()).build());
    }

}
