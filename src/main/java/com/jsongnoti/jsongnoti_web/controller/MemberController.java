package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.MemberResponse;
import com.jsongnoti.jsongnoti_web.controller.form.member.MemberDeleteRequest;
import com.jsongnoti.jsongnoti_web.controller.form.member.MemberUpdateRequest;
import com.jsongnoti.jsongnoti_web.controller.form.subscription.VerifyUnsubscriptionForm;
import com.jsongnoti.jsongnoti_web.service.MemberService;
import com.jsongnoti.jsongnoti_web.service.dto.MemberUpdateParam;
import com.jsongnoti.jsongnoti_web.service.result.MemberServiceResult;
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
public class MemberController {

    private final MemberService memberService;

    @PatchMapping("/users/{userId}")
    public ResponseEntity<MemberResponse> updateMember(@PathVariable(name = "userId") Long userId,
                                                   @Validated @RequestBody MemberUpdateRequest userUpdateRequest) {
        log.info("updateMember userUpdateForm: {}", userUpdateRequest);

        MemberUpdateParam memberUpdateParam = MemberUpdateParam.builder()
                .email(userUpdateRequest.getEmail())
                .username(userUpdateRequest.getUsername())
                .password(userUpdateRequest.getPassword())
                .favoriteSongPresentType(userUpdateRequest.getFavoriteSongPresentType())
                .favoriteSongPresentBrand(userUpdateRequest.getFavoriteSongPresentBrand())
                .build();
        MemberServiceResult memberServiceResult = memberService.updateMember(userId, memberUpdateParam);
        int status = memberServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(status)
                .body(MemberResponse.withMessage(memberServiceResult.getMessage()));
    }

    @PostMapping("/users/{userId}/delete")
    public ResponseEntity<MemberResponse> deleteMember(@PathVariable(name = "userId") Long userId,
                                                   @Validated @RequestBody MemberDeleteRequest userDeleteRequest) {
        log.info("deleteMember userId: {}, userDeleteRequest: {}", userId, userDeleteRequest);
        String email = userDeleteRequest.getEmail();
        MemberServiceResult memberServiceResult = memberService.requestDeleteMember(userId, email);
        int statusCode = memberServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(statusCode)
                .body(MemberResponse.withMessage(memberServiceResult.getMessage()));
    }

    @PostMapping("/users/{userId}/verify-delete")
    public ResponseEntity<MemberResponse> verifyDeleteMember(@PathVariable(name = "userId") Long userId,
                                                         @Validated @RequestBody VerifyUnsubscriptionForm verifyUnsubscriptionForm,
                                                         @RegisteredOAuth2AuthorizedClient("google") OAuth2AuthorizedClient oauth2Client) {
        String authenticationToken = verifyUnsubscriptionForm.getCode();

        String oauth2AccessToken = oauth2Client.getAccessToken().getTokenValue();

        MemberServiceResult memberServiceResult = memberService.verifyDeleteMember(userId, authenticationToken, oauth2AccessToken);
        int statusCode = memberServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(statusCode)
                .body(MemberResponse.withMessage(memberServiceResult.getMessage()));
    }

}
