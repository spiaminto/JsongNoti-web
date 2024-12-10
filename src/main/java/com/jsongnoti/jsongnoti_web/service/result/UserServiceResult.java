package com.jsongnoti.jsongnoti_web.service.result;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UserServiceResult {
    private boolean isSuccess;
    private String message;

    public static UserServiceResult success(String message) {
        return new UserServiceResult(true, message);
    }

    public static UserServiceResult fail(String message) {
        return new UserServiceResult(false, message);
    }

}
