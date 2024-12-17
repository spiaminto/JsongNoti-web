package com.jsongnoti.jsongnoti_web.controller;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Locale;
import java.util.Optional;

@ControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class ExceptionAdvice {

    private final MessageSource messageSource;

    // RuntimeException 예외 전역처리
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ExceptionResponse> handleException(RuntimeException e) {
        log.error("error: {}, message = {}", e.getClass().getName(), e.getMessage());
        return ResponseEntity.internalServerError().body(ExceptionResponse.withMessage("내부 오류가 발생했습니다."));
    }

    // DB 예외 전역처리
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ExceptionResponse> handleException(Exception e) {
        log.error("error: {}, message = {}", e.getClass().getName(), e.getMessage());
        return ResponseEntity.internalServerError().body(ExceptionResponse.withMessage("내부 데이터 오류가 발생했습니다."));
    }

    // NullPointerException 예외 전역처리
    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ExceptionResponse> handleException(NullPointerException e) {
        log.error("error: {}, message = {}", e.getClass().getName(), e.getMessage());
        return ResponseEntity.internalServerError().body(ExceptionResponse.withMessage("내부 오류가 발생했습니다."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ExceptionResponse> handleException(IllegalArgumentException e) {
        log.error("error: {}, message = {}", e.getClass().getName(), e.getMessage());
        return ResponseEntity.badRequest().body(ExceptionResponse.withMessage(e.getMessage()));
    }

    // @Valid 예외 처리
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ExceptionResponse> handleValidationException(MethodArgumentNotValidException ex) {
        log.error("error: {}, message = {}", ex.getClass().getName(), ex.getMessage());
        StringBuilder messageBuilder = new StringBuilder();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            String errorMessage = getErrorMessage(messageSource, error).orElse("입력값 오류입니다.");
            messageBuilder.append(errorMessage).append("\n");
        });
        return ResponseEntity.badRequest().body(ExceptionResponse.withMessage(messageBuilder.toString()));
    }

    /**
     * MessageSource 에서 code 우선순위 별로 message 뽑아오는 메소드. 
     * 쓰이는 곳이 많아지면 분리
     * @param messageSource
     * @return Optional message
     */
    public Optional<String> getErrorMessage(MessageSource messageSource, FieldError fieldError) {
        String[] codes = fieldError.getCodes(); // 우선순위 순서대로 code 들이 담겨있음
        Object[] args = fieldError.getArguments(); // [fieldName, 0, 1, ...] -> 프로퍼티에서 {0}, {1} 등으로 치환됨
        String resultMessage = null;
        for (String code : codes) {
            try {
                resultMessage = messageSource.getMessage(code, args, Locale.KOREA);
            } catch (NoSuchMessageException e) {
                continue; // 메시지가 없는경우 무시
            }
        }
        return Optional.ofNullable(resultMessage);
    }

    @Getter
    static class ExceptionResponse {
        private String message;
        private ExceptionResponse(String message) { this.message = message; }
        public static ExceptionResponse withMessage(String message) {
            return new ExceptionResponse(message);
        }
    }



}
