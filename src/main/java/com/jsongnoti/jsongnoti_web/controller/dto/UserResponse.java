package com.jsongnoti.jsongnoti_web.controller.dto;

public class UserResponse {

    private String message;
    private Long userId;

    private UserResponse(String message, Long userId) {
        this.message = message;
        this.userId = userId;
    }

    private UserResponse(String message) {
        this.message = message;
    }

    public static UserResponse withMessage(String message) {
        return new UserResponse(message);
    }

    public static UserResponse withMessageAndUserId(String message, Long userId) {
        return new UserResponse(message, userId);
    }

}
