package com.jsongnoti.jsongnoti_web.controller.form.favorite;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class FavoriteSongsReorderRequest {
    @NotNull
    Long userId;
    @NotNull
    Brand brand;
    @NotNull
    List<Long> favoriteSongIds;
}
