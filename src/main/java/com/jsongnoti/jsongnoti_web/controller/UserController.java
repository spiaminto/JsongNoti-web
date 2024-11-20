package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.*;
import com.jsongnoti.jsongnoti_web.service.UserServiceResult;
import com.jsongnoti.jsongnoti_web.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<UserResponse> addUser(@Validated @ModelAttribute AddUserForm addUserForm,
                                                BindingResult bindingResult) {
        if (bindingResult.hasErrors()) { return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage())); }

        String email = addUserForm.getEmail();
        log.debug("email: {}", email);

        UserServiceResult userServiceResult = userService.addUser(email);
        int statusCode = userServiceResult.isHasError() ? 409 : 200; // 검증실패시 409 Conflict

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessageAndUserId(userServiceResult.getMessage(), userServiceResult.getUserId()));
    }

    @PostMapping("/users/{userId}/verify-add")
    public ResponseEntity<UserResponse> verifyAddUser(@PathVariable(name = "userId") Long userId,
                                                      @Validated @ModelAttribute VerifyAddUserForm verifyAddUserForm,
                                                      BindingResult bindingResult) {
        if (bindingResult.hasErrors()) { return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage())); }

        String authenticationToken = verifyAddUserForm.getCode();
        log.debug("userId: {}, token: {}", userId, authenticationToken);

        UserServiceResult userServiceResult = userService.verifyAddUser(userId, authenticationToken);
        int statusCode = userServiceResult.isHasError() ? 409 : 200;

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessage(userServiceResult.getMessage()));
    }

    @PostMapping("/users/delete")
    public ResponseEntity<UserResponse> deleteUser(@Validated @ModelAttribute DeleteUserForm deleteUserForm,
                                                   BindingResult bindingResult) {
        if (bindingResult.hasErrors()) { return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage())); }

        String email = deleteUserForm.getEmail();
        log.debug("email: {}", email);

        UserServiceResult userServiceResult = userService.deleteUser(email);
        int statusCode = userServiceResult.isHasError() ? 409 : 200;

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessageAndUserId(userServiceResult.getMessage(), userServiceResult.getUserId()));
    }

    @PostMapping("/users/{userId}/verify-delete")
    public ResponseEntity<UserResponse> verifyDeleteUser(@PathVariable(name = "userId") Long userId,
                                                         @Validated @ModelAttribute VerifyDeleteUserForm verifyDeleteUserForm,
                                                         BindingResult bindingResult) {
        if (bindingResult.hasErrors()) { return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage())); }

        String authenticationToken = verifyDeleteUserForm.getCode();
        log.debug("userId: {}, token: {}", userId, authenticationToken);

        UserServiceResult userServiceResult = userService.verifyDeleteUser(userId, authenticationToken);
        int statusCode = userServiceResult.isHasError() ? 409 : 200;

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessage(userServiceResult.getMessage()));
    }



}
