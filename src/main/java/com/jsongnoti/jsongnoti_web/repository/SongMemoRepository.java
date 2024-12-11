package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.SongMemo;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongMemoRepository extends JpaRepository<SongMemo, Long> {

    long countByUserId(Long userId);

    // 정렬없이 조회 
    List<SongMemo> findByUserIdAndBrand(Long userId, Brand brand);

    /**
     * searchMemo - order by PresentOrder
     */
    List<SongMemo> findByUserIdAndBrandOrderByPresentOrderAsc(Long userId, Brand brand);

    /**
     * searchMemo - order by Singer
     */
    List<SongMemo> findByUserIdAndBrandOrderBySingerAsc(Long userId, Brand brand);

    /**
     * 순서 바꿀때 사용, presentOrder 이상인 것들 조회
     */
    List<SongMemo> findByUserIdAndPresentOrderGreaterThanEqual(Long userId, int presentOrder);

    /**
     * 저장 전 중복확인용
     */
    SongMemo findByUserIdAndBrandAndNumber(Long userId, Brand brand, int number);
}
