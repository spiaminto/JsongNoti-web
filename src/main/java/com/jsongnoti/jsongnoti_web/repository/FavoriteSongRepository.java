package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.FavoriteSong;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteSongRepository extends JpaRepository<FavoriteSong, Long> {

    long countByMemberId(Long userId);

    // 정렬없이 조회 
    List<FavoriteSong> findByMemberIdAndBrand(Long userId, Brand brand);

    /**
     * searchFavoriteSongs - order by PresentOrder
     */
    List<FavoriteSong> findByMemberIdAndBrandOrderByPresentOrderAsc(Long userId, Brand brand);

    @Query("""
            SELECT  new com.jsongnoti.jsongnoti_web.repository.FavoriteSongWithKoreanDto(
                        f.id, f.memberId, f.brand, f.songNumber,
                        f.title, sk.title, f.singer, sk.singer,
                        f.info,
                        f.presentOrder
                        )
            FROM FavoriteSong f
            LEFT JOIN SongKorean sk ON f.songId = sk.songId
            WHERE f.memberId = :userId AND f.brand = :brand
            ORDER BY f.presentOrder ASC
            """)
    List<FavoriteSongWithKoreanDto> findAllByMemberOrderByPresentOrder(Long userId, Brand brand);

    /**
     * searchFavoriteSongs - order by Singer
     */
    List<FavoriteSong> findByMemberIdAndBrandOrderBySingerAsc(Long userId, Brand brand);

    @Query("""
            SELECT new com.jsongnoti.jsongnoti_web.repository.FavoriteSongWithKoreanDto(
                        f.id, f.memberId, f.brand, f.songNumber,
                        f.title, sk.title, f.singer, sk.singer,
                        f.info,
                        f.presentOrder
                        )
            FROM FavoriteSong f
            LEFT JOIN SongKorean sk ON f.songId = sk.songId
            WHERE f.memberId = :userId AND f.brand = :brand
            ORDER BY f.singer ASC
            """)
    List<FavoriteSongWithKoreanDto> findAllByMemberOrderBySinger(Long userId, Brand brand);

    /**
     * 순서 바꿀때 사용, presentOrder 이상인 것들 조회
     */
    List<FavoriteSong> findByMemberIdAndBrandAndPresentOrderGreaterThanEqual(Long userId, Brand brand, int presentOrder);

    /**
     * 저장 전 중복확인용
     */
    FavoriteSong findByMemberIdAndBrandAndSongNumber(Long userId, Brand brand, int number);
}
