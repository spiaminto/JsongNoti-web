package com.jsongnoti.jsongnoti_web.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
@Slf4j
public class ExceptionAdvice {

    // DB 예외 전역처리
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<String> handleException(Exception e) {
        log.error("error: {}", e.getMessage());
        return ResponseEntity.internalServerError().body("내부 오류가 발생했습니다.");
    }

    // NullPointerException 예외 전역처리
    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<String> handleException(NullPointerException e) {
        log.error("error: {}", e.getMessage());
        return ResponseEntity.internalServerError().body("내부 오류가 발생했습니다.");
    }

}
