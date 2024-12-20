package com.jsongnoti.jsongnoti_web.controller.dto;

import lombok.Getter;

@Getter
public class SubscriptionResponse {

    private String message;
    private Long subscriptionId;

    private SubscriptionResponse(String message, Long subscriptionId) {
        this.message = message;
        this.subscriptionId = subscriptionId;
    }

    private SubscriptionResponse(String message) {
        this.message = message;
        this.subscriptionId = null;
    }

    public static SubscriptionResponse withMessage(String message) {
        return new SubscriptionResponse(message);
    }

    public static SubscriptionResponse withMessageAndUserId(String message, Long userId) {
        return new SubscriptionResponse(message, userId);
    }

}
