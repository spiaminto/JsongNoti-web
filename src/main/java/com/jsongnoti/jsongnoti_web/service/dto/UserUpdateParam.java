package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.MemoPresentType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserUpdateParam {

    private String email;
    private String username;
    private String password;

    private MemoPresentType memoPresentType;
    private Brand showMemoBrand;

}
