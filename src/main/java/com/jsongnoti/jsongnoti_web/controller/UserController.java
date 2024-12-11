package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.UserResponse;
import com.jsongnoti.jsongnoti_web.controller.form.user.UserUpdateRequest;
import com.jsongnoti.jsongnoti_web.service.UserService;
import com.jsongnoti.jsongnoti_web.service.dto.UserUpdateParam;
import com.jsongnoti.jsongnoti_web.service.result.UserServiceResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable(name = "userId") Long userId,
                                                   @Validated @RequestBody UserUpdateRequest userUpdateRequest) {
        log.info("updateUser userUpdateForm: {}", userUpdateRequest);

        UserUpdateParam userUpdateParam = UserUpdateParam.builder()
                .email(userUpdateRequest.getEmail())
                .username(userUpdateRequest.getUsername())
                .password(userUpdateRequest.getPassword())
                .memoPresentType(userUpdateRequest.getMemoPresentType())
                .showMemoBrand(userUpdateRequest.getShowMemoBrand())
                .build();
        UserServiceResult userServiceResult = userService.updateUser(userId, userUpdateParam);
        int status = userServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status)
                .body(UserResponse.withMessage(userServiceResult.getMessage()));
    }

}
