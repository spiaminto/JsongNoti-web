package com.jsongnoti.jsongnoti_web.service;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UserServiceResult {

    private boolean hasError;
    private String message;
    private Long userId;

    /**
     * 성공
     * @param message
     * @param userId
     * @return ResultDto
     */
    public static UserServiceResult success(String message, Long userId) {
        return new UserServiceResult(false, message, userId);
    }

    /**
     * 실패
     * @param message
     * @param userId
     * @return ResultDto
     */
    public static UserServiceResult fail(String message, Long userId) {
        return new UserServiceResult(true, message, userId);
    }



}
