package com.jsongnoti.jsongnoti_web.controller.form.user;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserDeleteVerifyRequest {

    @Size(min = 4, max = 4 , message = "{Size.code}")
    private String code;

}
