package com.jsongnoti.jsongnoti_web.log;


import com.jsongnoti.jsongnoti_web.log.trace.LogTrace;
import com.jsongnoti.jsongnoti_web.log.trace.TraceStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Slf4j
@Aspect @Component
public class LogTraceAspect {

    private final LogTrace logTrace;

    // Pointcut 표현식 분리
    @Pointcut("execution(* com.jsongnoti.jsongnoti_web.controller..*(..))")
    public void allController() {};

    @Pointcut("!execution(* com.jsongnoti.jsongnoti_web.controller..awsHealthCheck(..))")
    public void ignoreHealthCheck() {};

    @Pointcut("execution(* com.jsongnoti.jsongnoti_web.service..*(..))")
    public void allService() {};

    @Pointcut("execution(* com.jsongnoti.jsongnoti_web.repository..*(..))")
    public void allRepository() {};

    @Around("(allController() || allService() || allRepository()) && ignoreHealthCheck()")
    public Object execute(ProceedingJoinPoint joinPoint) throws Throwable {
        TraceStatus status = null;
        Object[] params = null;
        try {
            String message = joinPoint.getSignature().toShortString();
            params = joinPoint.getArgs();

            status = logTrace.begin(message);

            Object result = joinPoint.proceed();

            logTrace.end(status);
            return result;
        } catch (Exception e) {
            logTrace.exception(status, e, params);
            throw e; //예외를 처리하진 않음
        }
    }

}
