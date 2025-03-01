package com.jsongnoti.jsongnoti_web.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
//@ActiveProfiles("prod")
class SongSearchServiceTest {

    @Autowired
    SongSearchService songSearchService;

    @Test
    void searchSongsByKoreanTitleTest() {

    }
}