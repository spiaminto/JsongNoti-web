package com.jsongnoti.jsongnoti_web.service.dto;

import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.FavoriteSongPresentType;
import lombok.Data;

@Data
public class FavoriteSongSearchCond {
    private final Long memberId;
    private final Brand brand;
    private final FavoriteSongPresentType presentType;
}
