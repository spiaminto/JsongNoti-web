package com.jsongnoti.jsongnoti_web.controller.form.subscription;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UnsubscriptionForm {

    @Email @NotBlank @Size(max = 40)
    private String email;

}