package com.jsongnoti.jsongnoti_web.log.trace;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ThreadLocalLogTrace implements LogTrace {

    private static final String START_PREFIX = "->";
    private static final String START_MESSAGE = "===START===";
    private static final String COMPLETE_PREFIX = "<-";
    private static final String COMPLETE_MESSAGE = "===COMPLETE===";
    private static final String EX_PREFIX = "X";

    @Value("${log.trace.complete-enabled}")
    private boolean completeEnabled; // 완료 로그 출력 여부 프로퍼티에서 가져옴


    private ThreadLocal<TraceId> traceIdHolder = new ThreadLocal<>(); // 동시성 문제해결

    /**
     * message 를 받아 -> 방향의 로그를 찍는다.
     * 로그를 찍은 후, TraceStatus(traceId, message) 를 반환한다.
     */
    @Override
    public TraceStatus begin(String message) {
        syncTraceId();

        TraceId traceId = traceIdHolder.get();
        if (traceId.isFirstLevel()) {
            log.info("[{}] {}", traceId.getId(), START_MESSAGE);
        } else
            log.info("[{}] {}{}", traceId.getId(), addSpace(START_PREFIX, traceId.getLevel()), message);

        return new TraceStatus(traceId, message);
    }

    @Override
    public void end(TraceStatus status) {
        complete(status, null, null);
    }

    @Override
    public void exception(TraceStatus status, Exception e, Object[] params) {
        complete(status, e, params);
    }

    /**
     * TraceStatus 를 받아 <- 방향의 로그를 찍는다.
     * 예외 발생 시 해당 메서드에 전달된 파라미터를 같이 출력.
     */
    private void complete(TraceStatus status, Exception e, Object[] params) {
        TraceId traceId = status.getTraceId();
        if (e != null) {
            // exception 발생 시  파라미터를 같이 출력
            StringBuilder sb = new StringBuilder();
            for (Object param : params) {
                sb.append(param).append(",\n");
            }
            String stackTrace = Arrays.stream(e.getStackTrace())
                    .limit(10)
                    .map(StackTraceElement::toString)
                    .collect(Collectors.joining("\n"));
            log.error("[{}] {}{} \n exception = \n{}\n from = \n{}\n params = \n{}", traceId.getId(), addSpace(EX_PREFIX, traceId.getLevel()), status.getMessage(), e, stackTrace, sb);
        } else if (completeEnabled) {
            log.info("[{}] {}{}", traceId.getId(), addSpace(COMPLETE_PREFIX, traceId.getLevel()), status.getMessage());
        }

        if (traceId.isFirstLevel()) {
            log.info("[{}] {}", traceId.getId(), COMPLETE_MESSAGE);
        }

        releaseTraceId();
    }


    /**
     * TraceId 를 동기화(초기화)
     * traceIdHolder 에 TraceId 가 있으면 createNextId(), 없으면 new TraceId() 후 set.
     */
    private void syncTraceId() {
        TraceId traceId = traceIdHolder.get();
        if (traceId == null) {
            traceIdHolder.set(new TraceId());
        } else {
            traceIdHolder.set(traceId.createNextId());
        }
    }

    /**
     * TraceId 를 해제.
     * traceIdHolder 에 TraceId 의 깊이가 0 이면 remove(), 아니면 createPrevId() 후 set.
     */
    private void releaseTraceId() {
        TraceId traceId = traceIdHolder.get();
        if (traceId.isFirstLevel()) {
            traceIdHolder.remove();  //destroy
        } else {
            traceIdHolder.set(traceId.createPreviousId());
        }
    }

    /**
     * 화살표 그리기
     */
    private static String addSpace(String prefix, int level) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < level; i++) {
            sb.append((i == level - 1) ? "|" + prefix + " " : "|   ");
        }
        return sb.toString();
    }
}
