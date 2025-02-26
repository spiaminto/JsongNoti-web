package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {

    @Query("SELECT s FROM Song s " +
            "WHERE s.brand = :brand " +
            "AND s.regDate >= :startDate " +
            "AND s.regDate <= :endDate " +
            "ORDER BY s.regDate DESC")
    List<Song> findSongsByBrandBetweenTime(Brand brand, LocalDate startDate, LocalDate endDate);

    @Query("SELECT s FROM Song s " +
            "WHERE s.regDate >= :startDate " +
            "AND s.regDate <= :endDate " +
            "ORDER BY s.regDate DESC")
    List<Song> findSongsBetweenTime(LocalDate startDate, LocalDate endDate);


    // 원어 검색 =========================================================================================

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE s.title =% :keyword " +
                    "order by bigm_similarity(s.title, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByTitleSimilar(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE s.singer =% :keyword " +
                    "order by bigm_similarity(s.singer, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerSimilar(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE s.info =% :keyword " +
                    "order by bigm_similarity(s.info, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByInfoSimilar(String keyword);

    // 한글 우선검색 =====================================================================================

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.singer_prior LIKE likequery(:keyword) " +
                    "order by s.reg_date desc", nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerPrior(String keyword);


    // 한글검색 =======================================================================================
    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.title =% :keyword " +
                    "order by bigm_similarity(sk.title, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanTitleSimilar(String keyword);

    // title_read similarity 검색의 경우 높은 정확도의 결과만 가져오기 위해 similarity 0.5 이상인 결과만 가져옴
    @Query(value =
            "SELECT * from ( " +
                    "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean, bigm_similarity(:keyword, sk.title_read) as similarity " +
                    "FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.title_read =% :keyword " +
                    "order by bigm_similarity(sk.title_read, :keyword) desc ) " +
                    "as t " +
                    "where t.similarity > 0.5", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanTitleReadSimilar(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.singer =% :keyword " +
                    "order by bigm_similarity(sk.singer, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanSingerSimilar(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.singer_read =% :keyword " +
                    "order by bigm_similarity(sk.singer_read, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanSingerReadSimilar(String keyword);

    // 추가검색 ===========================================================================================
    // 추가검색은 언어 구별 없이 한번에 구현함 (원어, 한글, 한글read 동시 검색)

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.title_origin LIKE likequery(:keyword) OR sk.title LIKE likequery(:keyword) OR sk.title_read LIKE likequery(:keyword) " +
                    "order by s.reg_date desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByTitleLikeOriginOrKoreanOrRead(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.singer_origin LIKE likequery(:keyword) OR sk.singer LIKE likequery(:keyword) sk.singer_read LIKE likequery(:keyword) " +
                    "order by s.reg_date desc", nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerLikeOriginOrKoreanOrRead(String keyword);



//    @Query(value =
//            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
//                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
//                    "WHERE sk.info =% :keyword " +
//                    "order by bigm_similarity(sk.info, :keyword) desc", nativeQuery = true)
//    List<SongSearchResultDto> findSongByKoreanInfoSimilar(String keyword);

}
