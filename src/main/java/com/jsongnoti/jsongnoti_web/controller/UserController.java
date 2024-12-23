package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.UserResponse;
import com.jsongnoti.jsongnoti_web.controller.form.subscription.VerifyUnsubscriptionForm;
import com.jsongnoti.jsongnoti_web.controller.form.user.UserDeleteRequest;
import com.jsongnoti.jsongnoti_web.controller.form.user.UserUpdateRequest;
import com.jsongnoti.jsongnoti_web.service.UserService;
import com.jsongnoti.jsongnoti_web.service.dto.UserUpdateParam;
import com.jsongnoti.jsongnoti_web.service.result.UserServiceResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

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
                .favoriteSongPresentType(userUpdateRequest.getFavoriteSongPresentType())
                .favoriteSongPresentBrand(userUpdateRequest.getFavoriteSongPresentBrand())
                .build();
        UserServiceResult userServiceResult = userService.updateUser(userId, userUpdateParam);
        int status = userServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status)
                .body(UserResponse.withMessage(userServiceResult.getMessage()));
    }

    @PostMapping("/users/{userId}/delete")
    public ResponseEntity<UserResponse> deleteUser(@PathVariable(name = "userId") Long userId,
                                                   @Validated @RequestBody UserDeleteRequest userDeleteRequest) {
        log.info("deleteUser userId: {}, userDeleteRequest: {}", userId, userDeleteRequest);
        String email = userDeleteRequest.getEmail();
        UserServiceResult userServiceResult = userService.requestDeleteUser(userId, email);
        int statusCode = userServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessage(userServiceResult.getMessage()));
    }

    @PostMapping("/users/{userId}/verify-delete")
    public ResponseEntity<UserResponse> verifyDeleteUser(@PathVariable(name = "userId") Long userId,
                                                         @Validated @RequestBody VerifyUnsubscriptionForm verifyUnsubscriptionForm,
                                                         @RegisteredOAuth2AuthorizedClient("google") OAuth2AuthorizedClient oauth2Client) {
        String authenticationToken = verifyUnsubscriptionForm.getCode();

        String oauth2AccessToken = oauth2Client.getAccessToken().getTokenValue();

        UserServiceResult userServiceResult = userService.verifyDeleteUser(userId, authenticationToken, oauth2AccessToken);
        int statusCode = userServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessage(userServiceResult.getMessage()));
    }

}
