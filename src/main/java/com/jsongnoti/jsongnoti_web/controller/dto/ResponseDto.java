package com.jsongnoti.jsongnoti_web.controller.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResponseDto {

    private String message;
    private long userId;

}
