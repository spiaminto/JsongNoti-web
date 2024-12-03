package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import lombok.Data;

@Data
public class MemoSearchCond {
    private final Brand brand;
    private final String presentType;
}
