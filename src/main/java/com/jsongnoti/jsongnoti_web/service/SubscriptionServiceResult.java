package com.jsongnoti.jsongnoti_web.service;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SubscriptionServiceResult {

    private boolean hasError;
    private String message;
    private Long userId;

    /**
     * 성공
     * @param message
     * @param userId
     * @return ResultDto
     */
    public static SubscriptionServiceResult success(String message, Long userId) {
        return new SubscriptionServiceResult(false, message, userId);
    }

    /**
     * 실패
     * @param message
     * @param userId
     * @return ResultDto
     */
    public static SubscriptionServiceResult fail(String message, Long userId) {
        return new SubscriptionServiceResult(true, message, userId);
    }



}
