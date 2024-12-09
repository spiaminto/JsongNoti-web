package com.jsongnoti.jsongnoti_web.controller.form.memo;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.MemoPresentType;
import lombok.Data;

@Data
public class MemoSearchForm {
    private Brand brand;
    private MemoPresentType memoPresentType;
}
