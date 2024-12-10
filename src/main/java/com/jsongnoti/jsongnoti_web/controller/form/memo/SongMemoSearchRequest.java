package com.jsongnoti.jsongnoti_web.controller.form.memo;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.MemoPresentType;
import lombok.Data;

@Data
public class SongMemoSearchRequest {
    private Brand brand;
    private MemoPresentType memoPresentType;
}
