package com.jsongnoti.jsongnoti_web;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

public class NormalTest {

    @Test
    public void test() {
        LocalDate now = LocalDate.now();
        LocalDate startDate = LocalDate.of(2025, 01, 1);
        LocalDate endDate = startDate.minusMonths(2);

        System.out.println("startDate = " + startDate);
        System.out.println("endDate = " + endDate);
    }

}
