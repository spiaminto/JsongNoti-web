package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.domain.SongKorean;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongKoreanRepository extends JpaRepository<SongKorean, Long> {

    List<SongKorean> findSongByTitleContaining(String keyword);

    List<SongKorean> findSongBySingerContaining(String keyword);

//    List<SongKorean> findSongByInfoContaining(String keyword);

    @Query(value =
            "SELECT * FROM {h-schema} song_korean " +
                    "WHERE title =% :keyword " +
                    "order by bigm_similarity(title, :keyword) desc", nativeQuery = true)
    List<SongKorean> findSongByTitleSimilar(String keyword);

    @Query(value =
            "SELECT * FROM {h-schema} song_korean " +
                    "WHERE singer =% :keyword " +
                    "order by bigm_similarity(singer, :keyword) desc", nativeQuery = true)
    List<SongKorean> findSongBySingerSimilar(String keyword);

//    @Query(value =
//            "SELECT * FROM {h-schema} song_korean " +
//                    "WHERE info =% :keyword " +
//                    "order by bigm_similarity(info, :keyword) desc", nativeQuery = true)
//    List<SongKorean> findSongByInfoSimilar(String keyword);

}
