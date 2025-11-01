package com.jsongnoti.jsongnoti_web.controller.form.member;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.FavoriteSongPresentType;
import lombok.Data;

@Data
public class MemberUpdateRequest {
    private String email;
    private String username;
    private String password;

    // 현재 사용자에게 수정이 오픈된 필드
    private FavoriteSongPresentType favoriteSongPresentType;
    private Brand favoriteSongPresentBrand;
}
