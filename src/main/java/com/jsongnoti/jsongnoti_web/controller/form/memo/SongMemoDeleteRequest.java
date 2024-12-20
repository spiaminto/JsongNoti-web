package com.jsongnoti.jsongnoti_web.controller.form.memo;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SongMemoDeleteRequest {
    @NotNull
    private Long userId;
}
