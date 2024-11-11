package com.jsongnoti.jsongnoti_web.controller;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubscriptionDto {

    @Email @NotBlank @Size(max = 40, message = "{Size.email}")
    private String email;

}
