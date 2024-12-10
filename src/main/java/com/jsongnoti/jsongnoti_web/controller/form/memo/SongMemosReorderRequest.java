package com.jsongnoti.jsongnoti_web.controller.form.memo;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import lombok.Data;

import java.util.List;

@Data
public class SongMemosReorderRequest {
    Long userId;
    Brand brand;
    List<Long> memoIds;
}
