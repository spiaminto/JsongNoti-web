package com.jsongnoti.jsongnoti_web.controller.form.search;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import lombok.Data;

@Data
public class SongSearchRequest {

    private Brand brand;
    private SongSearchType searchType;
    private String keyword;

}
