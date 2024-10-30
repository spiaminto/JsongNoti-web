package com.jsongnoti.jsongnoti_web.log.trace;

import java.util.UUID;

/**
 * 요청 id 와 요청 level 을 가지는 TraceId 클래스.
 */
public class TraceId {

    private String id;
    private int level;

    public TraceId() {
        this.id = createId();
        this.level = 0;
    }

    private TraceId(String id, int level) {
        this.id = id;
        this.level = level;
    }

    /**
     * 요청 id 생성. TraceId 내부에서만 사용.
     */
    private String createId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * 요청 id 유지, level 증가
     */
    public TraceId createNextId() {
        return new TraceId(id, level + 1);
    }

    /**
     * 요청 id 유지, level 감소
     */
    public TraceId createPreviousId() {return new TraceId(id, level - 1); }

    public boolean isFirstLevel() {
        return level == 0;
    }

    public String getId() {
        return id;
    }

    public int getLevel() {
        return level;
    }
}
