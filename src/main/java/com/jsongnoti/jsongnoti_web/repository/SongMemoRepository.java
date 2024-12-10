package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.SongMemo;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongMemoRepository extends JpaRepository<SongMemo, Long> {

    long countByUserId(Long userId);

    List<SongMemo> findByBrandOrderByPresentOrderAsc(Brand brand);

    List<SongMemo> findByUserIdOrderByPresentOrderAsc(Long userId);

    List<SongMemo> findByUserIdAndPresentOrderGreaterThanEqual(Long userId, int presentOrder);

    List<SongMemo> findByUserIdAndBrand(Long userId, Brand brand);

    SongMemo findByUserIdAndBrandAndNumber(Long userId, Brand brand, int number);
}
