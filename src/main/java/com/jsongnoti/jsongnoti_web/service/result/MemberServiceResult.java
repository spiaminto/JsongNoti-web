package com.jsongnoti.jsongnoti_web.service.result;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor(access = AccessLevel.PRIVATE)
public class MemberServiceResult {
    private boolean isSuccess;
    private String message;

    public static MemberServiceResult success(String message) {
        return new MemberServiceResult(true, message);
    }

    public static MemberServiceResult fail(String message) {
        return new MemberServiceResult(false, message);
    }

}
