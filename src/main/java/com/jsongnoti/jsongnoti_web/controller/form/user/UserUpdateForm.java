package com.jsongnoti.jsongnoti_web.controller.form.user;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.MemoPresentType;
import lombok.Data;

import java.util.Optional;

// UserUpdate 는 폼에 null 허용, null 이 아닌필드만 업데이트
@Data
public class UserUpdateForm {
    private String email;
    private String username; // email 에서 @ 제외한 나머지로 임의생성
    private String password;

    // 현재 사용자에게 수정이 오픈된 필드
    private MemoPresentType memoPresentType;
    private Brand showMemoBrand;
}
