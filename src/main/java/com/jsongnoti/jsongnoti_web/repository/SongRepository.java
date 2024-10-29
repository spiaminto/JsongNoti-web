package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {

    @Query("SELECT s FROM Song s " +
            "WHERE s.brand = :brand AND " +
            "DATE(s.createdAt) = (SELECT DATE(MAX(s2.createdAt)) FROM Song s2 WHERE s2.brand = :brand)")
    List<Song> findLatestSongsByBrand(Brand brand);

}
