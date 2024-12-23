package com.jsongnoti.jsongnoti_web.controller.form.favorite;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.FavoriteSongPresentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FavoriteSongSearchRequest {
    @NotNull
    private Long userId;
    @NotNull
    private Brand brand;
    @NotNull
    private FavoriteSongPresentType favoriteSongPresentType;
}
