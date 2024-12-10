package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.MemoPresentType;
import lombok.Data;

@Data
public class MemoSearchCond {
    private final Brand brand;
    private final MemoPresentType presentType;
}
