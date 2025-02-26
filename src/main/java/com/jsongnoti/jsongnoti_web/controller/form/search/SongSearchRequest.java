package com.jsongnoti.jsongnoti_web.controller.form.search;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.SongSearchType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SongSearchRequest {
    @NotNull
    private Brand brand;
    @NotNull
    private SongSearchType searchType;
    @Size(min = 2, max = 20)
    private String keyword;
    private boolean additionalSearch;
}
