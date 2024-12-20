package com.jsongnoti.jsongnoti_web.controller.form.memo;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.MemoPresentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SongMemoSearchRequest {
    @NotNull
    private Long userId;
    @NotNull
    private Brand brand;
    @NotNull
    private MemoPresentType memoPresentType;
}
