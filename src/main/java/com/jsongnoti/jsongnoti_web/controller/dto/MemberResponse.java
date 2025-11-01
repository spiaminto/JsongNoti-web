package com.jsongnoti.jsongnoti_web.controller.dto;

import lombok.Getter;

@Getter
public class MemberResponse {

    private String message;

    private MemberResponse(String message) {
        this.message = message;
    }

    public static MemberResponse withMessage(String message) {
        return new MemberResponse(message);
    }

}
