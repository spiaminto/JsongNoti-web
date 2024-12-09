package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.form.user.UserUpdateForm;
import com.jsongnoti.jsongnoti_web.service.UserService;
import com.jsongnoti.jsongnoti_web.service.dto.UserUpdateParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
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
    public void updateUser(@PathVariable(name = "userId") Long userId,
                           @ModelAttribute UserUpdateForm userUpdateForm) {
        log.info("updateUser userUpdateForm: {}", userUpdateForm);

        UserUpdateParam userUpdateParam = UserUpdateParam.builder()
                .email(userUpdateForm.getEmail())
                .username(userUpdateForm.getUsername())
                .password(userUpdateForm.getPassword())
                .memoPresentType(userUpdateForm.getMemoPresentType())
                .showMemoBrand(userUpdateForm.getShowMemoBrand())
                .build();
        userService.updateUser(userId, userUpdateParam);
    }

}
