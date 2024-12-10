package com.jsongnoti.jsongnoti_web.domain.enums;

import lombok.Getter;

@Getter
public enum Brand {
    ALL("전체"), // 메모테이블에서 사용
    TJ("TJ"),
    KY("금영"),
    TEST("테스트");

    private final String name;

    Brand(String name) {
        this.name = name;
    }
}
