package com.jsongnoti.jsongnoti_web.controller.dto;

import lombok.Getter;

@Getter
public class UserResponse {

    private String message;
    private Long subscriptionId;

    private UserResponse(String message, Long subscriptionId) {
        this.message = message;
        this.subscriptionId = subscriptionId;
    }

    private UserResponse(String message) {
        this.message = message;
        this.subscriptionId = null;
    }

    public static UserResponse withMessage(String message) {
        return new UserResponse(message);
    }

    public static UserResponse withMessageAndUserId(String message, Long userId) {
        return new UserResponse(message, userId);
    }

}
