package com.jsongnoti.jsongnoti_web.controller.dto;

import lombok.Getter;

@Getter
public class UserResponse {

    private String message;

    private UserResponse(String message) {
        this.message = message;
    }

    public static UserResponse withMessage(String message) {
        return new UserResponse(message);
    }

}
