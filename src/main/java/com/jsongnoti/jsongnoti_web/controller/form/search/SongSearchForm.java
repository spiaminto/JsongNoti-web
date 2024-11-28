package com.jsongnoti.jsongnoti_web.controller.form.search;

import com.jsongnoti.jsongnoti_web.domain.SongSearchType;
import lombok.Data;

@Data
public class SongSearchForm {

    private String keyword;
    private SongSearchType searchType;

}
