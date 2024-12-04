package com.jsongnoti.jsongnoti_web.controller.form.memo;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import lombok.Data;

@Data
public class DeleteMemoForm {

    private Brand brand;
    private int number;

}
