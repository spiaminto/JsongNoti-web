package com.jsongnoti.jsongnoti_web.controller.form.memo;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import lombok.Data;

import java.util.List;

@Data
public class SwitchOrderForm {
    Brand brand;
    List<Integer> numbers;
}
