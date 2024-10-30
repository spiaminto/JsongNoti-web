package com.jsongnoti.jsongnoti_web.service;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class ResultDto {

    private boolean hasError;
    private String message;

}
