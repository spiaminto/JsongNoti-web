package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.FavoriteSongPresentType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MemberUpdateParam {

    private String email;
    private String username;
    private String password;

    private FavoriteSongPresentType favoriteSongPresentType;
    private Brand favoriteSongPresentBrand;

}
