package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import com.jsongnoti.jsongnoti_web.service.SongSearchService;
import com.jsongnoti.jsongnoti_web.service.dto.SongSearchCond;
import com.jsongnoti.jsongnoti_web.service.result.SongSearchResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SongControllerTest {

    private SongSearchService songSearchService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        songSearchService = mock(SongSearchService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new SongController(songSearchService)).build();
    }

    @Test
    void infoSearchBindsRequestAndReturnsGuideMessage() throws Exception {
        when(songSearchService.searchSongs(any())).thenReturn(
                SongSearchResult.success("작품명을 함께 입력해주세요. 예: 원피스 OP", List.of())
        );

        mockMvc.perform(get("/songs")
                        .param("brand", "TJ")
                        .param("searchType", "INFO")
                        .param("keyword", "OP")
                        .param("additionalSearch", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("작품명을 함께 입력해주세요. 예: 원피스 OP"))
                .andExpect(jsonPath("$.songs").isArray())
                .andExpect(jsonPath("$.songs").isEmpty());

        ArgumentCaptor<SongSearchCond> searchCondCaptor = ArgumentCaptor.forClass(SongSearchCond.class);
        verify(songSearchService).searchSongs(searchCondCaptor.capture());
        assertThat(searchCondCaptor.getValue().getSearchType()).isEqualTo(SongSearchType.INFO);
        assertThat(searchCondCaptor.getValue().getBrand()).isEqualTo(Brand.TJ);
    }
}
