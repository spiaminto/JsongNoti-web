package com.jsongnoti.jsongnoti_web.controller.form.user;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.MemoPresentType;
import lombok.Data;

@Data
public class UserUpdateRequest {
    private String email;
    private String username;
    private String password;

    // 현재 사용자에게 수정이 오픈된 필드
    private MemoPresentType memoPresentType;
    private Brand showMemoBrand;
}
