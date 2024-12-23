package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.FavoriteSong;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteSongRepository extends JpaRepository<FavoriteSong, Long> {

    long countByUserId(Long userId);

    // 정렬없이 조회 
    List<FavoriteSong> findByUserIdAndBrand(Long userId, Brand brand);

    /**
     * searchFavoriteSongs - order by PresentOrder
     */
    List<FavoriteSong> findByUserIdAndBrandOrderByPresentOrderAsc(Long userId, Brand brand);

    /**
     * searchFavoriteSongs - order by Singer
     */
    List<FavoriteSong> findByUserIdAndBrandOrderBySingerAsc(Long userId, Brand brand);

    /**
     * 순서 바꿀때 사용, presentOrder 이상인 것들 조회
     */
    List<FavoriteSong> findByUserIdAndPresentOrderGreaterThanEqual(Long userId, int presentOrder);

    /**
     * 저장 전 중복확인용
     */
    FavoriteSong findByUserIdAndBrandAndNumber(Long userId, Brand brand, int number);
}
