package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.controller.dto.SubscriptionResponse;
import com.jsongnoti.jsongnoti_web.controller.form.subscription.SubscriptionForm;
import com.jsongnoti.jsongnoti_web.controller.form.subscription.UnsubscriptionForm;
import com.jsongnoti.jsongnoti_web.controller.form.subscription.VerifySubscriptionForm;
import com.jsongnoti.jsongnoti_web.controller.form.subscription.VerifyUnsubscriptionForm;
import com.jsongnoti.jsongnoti_web.service.SubscriptionService;
import com.jsongnoti.jsongnoti_web.service.result.SubscriptionServiceResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/subscriptions")
    public ResponseEntity<SubscriptionResponse> addUser(@Valid @ModelAttribute SubscriptionForm subscriptionForm) {

        String email = subscriptionForm.getEmail();
        log.debug("email: {}", email);

        SubscriptionServiceResult subscriptionServiceResult = subscriptionService.subscribe(email);
        int statusCode = subscriptionServiceResult.isSuccess() ? 200 : 409; // 검증실패시 409 Conflict

        return ResponseEntity.status(statusCode)
                .body(SubscriptionResponse.withMessageAndUserId(subscriptionServiceResult.getMessage(), subscriptionServiceResult.getUserId()));
    }

    @PostMapping("/subscriptions/{subscriptionId}/verify-add")
    public ResponseEntity<SubscriptionResponse> verifyAddUser(@PathVariable(name = "subscriptionId") Long subscriptionId,
                                                              @Valid @ModelAttribute VerifySubscriptionForm verifySubscriptionForm) {

        String authenticationToken = verifySubscriptionForm.getCode();
        log.debug("subscriptionId: {}, token: {}", subscriptionId, authenticationToken);

        SubscriptionServiceResult subscriptionServiceResult = subscriptionService.verifySubscription(subscriptionId, authenticationToken);
        int statusCode = subscriptionServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(statusCode)
                .body(SubscriptionResponse.withMessage(subscriptionServiceResult.getMessage()));
    }

    @PostMapping("/subscriptions/delete")
    public ResponseEntity<SubscriptionResponse> deleteUser(@Valid @ModelAttribute UnsubscriptionForm unsubscriptionForm) {

        String email = unsubscriptionForm.getEmail();
        log.debug("email: {}", email);

        SubscriptionServiceResult subscriptionServiceResult = subscriptionService.unsubscribe(email);
        int statusCode = subscriptionServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(statusCode)
                .body(SubscriptionResponse.withMessageAndUserId(subscriptionServiceResult.getMessage(), subscriptionServiceResult.getUserId()));
    }

    @PostMapping("/subscriptions/{subscriptionId}/verify-delete")
    public ResponseEntity<SubscriptionResponse> verifyDeleteUser(@PathVariable(name = "subscriptionId") Long subscriptionId,
                                                                 @Valid @ModelAttribute VerifyUnsubscriptionForm verifyUnsubscriptionForm) {

        String authenticationToken = verifyUnsubscriptionForm.getCode();
        log.debug("subscriptionId: {}, token: {}", subscriptionId, authenticationToken);

        SubscriptionServiceResult subscriptionServiceResult = subscriptionService.verifyUnsubscription(subscriptionId, authenticationToken);
        int statusCode = subscriptionServiceResult.isSuccess() ? 200 : 409;

        return ResponseEntity.status(statusCode)
                .body(SubscriptionResponse.withMessage(subscriptionServiceResult.getMessage()));
    }



}
