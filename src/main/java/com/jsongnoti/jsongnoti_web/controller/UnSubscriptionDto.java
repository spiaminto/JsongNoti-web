package com.jsongnoti.jsongnoti_web.controller;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UnSubscriptionDto {

    @Email @NotBlank
    private String email;

}