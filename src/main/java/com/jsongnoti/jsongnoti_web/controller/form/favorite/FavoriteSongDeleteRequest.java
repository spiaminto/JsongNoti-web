package com.jsongnoti.jsongnoti_web.controller.form.favorite;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FavoriteSongDeleteRequest {
    @NotNull
    private Long userId;
}
