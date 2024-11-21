package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.*;
import com.jsongnoti.jsongnoti_web.service.SubscriptionServiceResult;
import com.jsongnoti.jsongnoti_web.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/subscriptions")
    public ResponseEntity<UserResponse> addUser(@Validated @ModelAttribute SubscriptionForm subscriptionForm,
                                                BindingResult bindingResult) {
        if (bindingResult.hasErrors()) { return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage())); }

        String email = subscriptionForm.getEmail();
        log.debug("email: {}", email);

        SubscriptionServiceResult subscriptionServiceResult = subscriptionService.subscribe(email);
        int statusCode = subscriptionServiceResult.isHasError() ? 409 : 200; // 검증실패시 409 Conflict

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessageAndUserId(subscriptionServiceResult.getMessage(), subscriptionServiceResult.getUserId()));
    }

    @PostMapping("/subscriptions/{subscriptionId}/verify-add")
    public ResponseEntity<UserResponse> verifyAddUser(@PathVariable(name = "subscriptionId") Long subscriptionId,
                                                      @Validated @ModelAttribute VerifySubscriptionForm verifySubscriptionForm,
                                                      BindingResult bindingResult) {
        if (bindingResult.hasErrors()) { return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage())); }

        String authenticationToken = verifySubscriptionForm.getCode();
        log.debug("subscriptionId: {}, token: {}", subscriptionId, authenticationToken);

        SubscriptionServiceResult subscriptionServiceResult = subscriptionService.verifySubscription(subscriptionId, authenticationToken);
        int statusCode = subscriptionServiceResult.isHasError() ? 409 : 200;

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessage(subscriptionServiceResult.getMessage()));
    }

    @PostMapping("/subscriptions/delete")
    public ResponseEntity<UserResponse> deleteUser(@Validated @ModelAttribute UnsubscriptionForm unsubscriptionForm,
                                                   BindingResult bindingResult) {
        if (bindingResult.hasErrors()) { return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage())); }

        String email = unsubscriptionForm.getEmail();
        log.debug("email: {}", email);

        SubscriptionServiceResult subscriptionServiceResult = subscriptionService.unsubscribe(email);
        int statusCode = subscriptionServiceResult.isHasError() ? 409 : 200;

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessageAndUserId(subscriptionServiceResult.getMessage(), subscriptionServiceResult.getUserId()));
    }

    @PostMapping("/subscriptions/{subscriptionId}/verify-delete")
    public ResponseEntity<UserResponse> verifyDeleteUser(@PathVariable(name = "subscriptionId") Long subscriptionId,
                                                         @Validated @ModelAttribute VerifyUnsubscriptionForm verifyUnsubscriptionForm,
                                                         BindingResult bindingResult) {
        if (bindingResult.hasErrors()) { return ResponseEntity.badRequest().body(UserResponse.withMessage(bindingResult.getFieldError().getDefaultMessage())); }

        String authenticationToken = verifyUnsubscriptionForm.getCode();
        log.debug("subscriptionId: {}, token: {}", subscriptionId, authenticationToken);

        SubscriptionServiceResult subscriptionServiceResult = subscriptionService.verifyUnsubscription(subscriptionId, authenticationToken);
        int statusCode = subscriptionServiceResult.isHasError() ? 409 : 200;

        return ResponseEntity.status(statusCode)
                .body(UserResponse.withMessage(subscriptionServiceResult.getMessage()));
    }



}
