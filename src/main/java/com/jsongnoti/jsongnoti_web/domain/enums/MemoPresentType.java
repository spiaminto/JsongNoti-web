package com.jsongnoti.jsongnoti_web.domain.enums;

import lombok.Getter;

@Getter
public enum MemoPresentType {
    PRESENT_ORDER("순서대로"),
    ARTIST("아티스트별");

    private final String name;

    MemoPresentType(String name) {
        this.name = name;
    }
}
