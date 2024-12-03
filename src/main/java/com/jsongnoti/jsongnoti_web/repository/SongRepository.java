package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
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


    // 검색 =========================================================================================
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

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.title =% :keyword " +
                    "order by bigm_similarity(sk.title, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanTitleSimilar(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.title_read =% :keyword " +
                    "order by bigm_similarity(sk.title_read, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanTitleReadSimilar(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.singer_read =% :keyword " +
                    "order by bigm_similarity(sk.singer_read, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanSingerSimilar(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.singer =% :keyword " +
                    "order by bigm_similarity(sk.singer, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanSingerReadSimilar(String keyword);

    @Query(value =
            "SELECT s.id, s.brand, s.number, s.title, s.singer, s.info, sk.title as title_korean FROM {h-schema} song s " +
                    "JOIN {h-schema} song_korean sk ON s.id = sk.song_id " +
                    "WHERE sk.info =% :keyword " +
                    "order by bigm_similarity(sk.info, :keyword) desc", nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanInfoSimilar(String keyword);

}
