package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    List<Song> findSongByTitleContaining(String keyword);

    List<Song> findSongBySingerContaining(String keyword);

    List<Song> findSongByInfoContaining(String keyword);

    @Query(value =
            "SELECT * FROM {h-schema} song " +
                    "WHERE title =% :keyword " +
                    "order by bigm_similarity(title, :keyword) desc", nativeQuery = true)
    List<Song> findSongByTitleSimilar(String keyword);

    @Query(value =
            "SELECT * FROM {h-schema} song " +
                    "WHERE singer =% :keyword " +
                    "order by bigm_similarity(singer, :keyword) desc", nativeQuery = true)
    List<Song> findSongBySingerSimilar(String keyword);

    @Query(value =
            "SELECT * FROM {h-schema} song " +
                    "WHERE info =% :keyword " +
                    "order by bigm_similarity(info, :keyword) desc", nativeQuery = true)
    List<Song> findSongByInfoSimilar(String keyword);

}
