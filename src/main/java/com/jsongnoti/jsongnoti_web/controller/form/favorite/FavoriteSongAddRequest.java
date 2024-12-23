package com.jsongnoti.jsongnoti_web.controller.form.favorite;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FavoriteSongAddRequest {

    @NotNull
    private Long userId;

    @NotNull
    private Long songId;

    @NotNull
    private int presentOrder;

    @Size(max = 50)
    private String infoText;

}
