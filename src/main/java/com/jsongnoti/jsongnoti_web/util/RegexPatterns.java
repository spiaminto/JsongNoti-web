package com.jsongnoti.jsongnoti_web.util;

import java.util.regex.Pattern;

public class RegexPatterns {
    private static final Pattern KOREAN = Pattern.compile("\\p{IsHangul}");
    public static boolean hasKorean(String keyword) {
        return KOREAN.matcher(keyword).find();
    }
}
