package com.jsongnoti.jsongnoti_web.controller.form.memo;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import lombok.Data;

@Data
public class MemoSearchForm {
    private Brand brand;
    private String presentType;
}
