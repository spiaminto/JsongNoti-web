package com.jsongnoti.jsongnoti_web.domain;

import lombok.Getter;

@Getter
public enum SongSearchType {
    TITLE("title"),
    SINGER("singer"),
    INFO("info");

    private final String name;

    SongSearchType(String name) {
        this.name = name;
    }

}
