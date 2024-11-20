package com.jsongnoti.jsongnoti_web.controller.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyDeleteUserForm {

    @Size(min = 4, max = 4 , message = "{Size.code}")
    private String code;

}
