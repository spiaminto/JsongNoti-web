package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.SongSearchType;
import lombok.Data;

@Data
public class SongSearchCond {
    private final SongSearchType searchType;
    private final String keyword;
}
