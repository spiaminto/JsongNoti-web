package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.UserResponse;
import com.jsongnoti.jsongnoti_web.controller.form.user.UserUpdateForm;
import com.jsongnoti.jsongnoti_web.service.UserService;
import com.jsongnoti.jsongnoti_web.service.dto.UserServiceResult;
import com.jsongnoti.jsongnoti_web.service.dto.UserUpdateParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable(name = "userId") Long userId,
                                                   @Validated @ModelAttribute UserUpdateForm userUpdateForm,
                                                   BindingResult bindingResult) {
        log.info("updateUser userUpdateForm: {}", userUpdateForm);
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage()));
        }

        UserUpdateParam userUpdateParam = UserUpdateParam.builder()
                .email(userUpdateForm.getEmail())
                .username(userUpdateForm.getUsername())
                .password(userUpdateForm.getPassword())
                .memoPresentType(userUpdateForm.getMemoPresentType())
                .showMemoBrand(userUpdateForm.getShowMemoBrand())
                .build();
        UserServiceResult userServiceResult = userService.updateUser(userId, userUpdateParam);
        int status = userServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status)
                .body(UserResponse.withMessage(userServiceResult.getMessage()));
    }

}
