package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
//@ActiveProfiles("prod")
class SongSearchServiceTest {

    @Autowired
    SongSearchService songSearchService;

    @Test
    void searchSongsByKoreanTitleTest() {

        // given
        SongSearchCond searchCond = new SongSearchCond(SongSearchType.SINGER, "미세스",  Brand.TJ);

        // when
        SongSearchResult result = songSearchService.searchSongs(searchCond);

    }
}