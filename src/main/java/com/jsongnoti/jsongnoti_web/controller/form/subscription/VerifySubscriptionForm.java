package com.jsongnoti.jsongnoti_web.controller.form.subscription;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifySubscriptionForm {

    @Size(min = 4, max = 4)
    private String code;

}
