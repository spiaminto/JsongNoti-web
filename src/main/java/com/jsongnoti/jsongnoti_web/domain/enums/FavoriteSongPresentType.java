package com.jsongnoti.jsongnoti_web.domain.enums;

import lombok.Getter;

@Getter
public enum FavoriteSongPresentType {
    PRESENT_ORDER("순서대로"),
    ARTIST("아티스트별");

    private final String name;

    FavoriteSongPresentType(String name) {
        this.name = name;
    }
}
