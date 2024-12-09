package com.jsongnoti.jsongnoti_web.controller.form.memo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MemoAddForm {

    @NotNull
    private Long userId;

    @NotNull
    private Long songId;

    @NotNull
    private int presentOrder;

    @NotNull @Size(max = 50, message = "${Size.infoText}")
    private String infoText;

}
