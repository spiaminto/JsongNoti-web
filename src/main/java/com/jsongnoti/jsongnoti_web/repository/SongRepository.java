package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

}
