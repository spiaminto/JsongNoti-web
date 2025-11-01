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

    @Query("""
            SELECT new com.jsongnoti.jsongnoti_web.repository.SongWithKoreanDto(
                        s.brand, s.songNumber, s.title, sk.title, s.singer, sk.singer, s.info, s.regDate
                        )
                         FROM Song s
                        LEFT JOIN SongKorean sk on s.id = sk.songId
            WHERE s.regDate >= :startDate AND s.regDate <= :endDate
            ORDER BY s.regDate DESC
            """)
    List<SongWithKoreanDto> findSongsBetweenTime(LocalDate startDate, LocalDate endDate);

//    @Query("SELECT s FROM Song s " +
//            "WHERE s.regDate >= :startDate " +
//            "AND s.regDate <= :endDate " +
//            "ORDER BY s.regDate DESC")
//    List<Song> findSongsBetweenTime(LocalDate startDate, LocalDate endDate);


    // 원어 검색 =========================================================================================

    @Query(value = """
                WITH song_fuzzy_matches AS (
                    SELECT s.*,
                           GREATEST(
                                   FUZZY_MATCH(LEVENSHTEIN, s.TITLE, :keyword),
                                   FUZZY_MATCH(LEVENSHTEIN, s.TITLE, UPPER(:keyword))
                           ) as similarity
                    FROM SONG s
                )
                SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO, s.similarity, sk.title as title_korean
                FROM SONG_KOREAN sk
                         JOIN song_fuzzy_matches s ON s.id = sk.song_id
                where s.similarity >= 40
                ORDER BY s.similarity DESC
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByTitleSimilar(String keyword);

    @Query(value = """
                WITH song_fuzzy_matches AS (
                    SELECT s.*,
                           GREATEST(
                                   FUZZY_MATCH(LEVENSHTEIN, s.SINGER, :keyword),
                                   FUZZY_MATCH(LEVENSHTEIN, s.SINGER, UPPER(:keyword))
                           ) as similarity
                    FROM SONG s
                )
                SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO, s.similarity, sk.title as title_korean
                FROM SONG_KOREAN sk
                         JOIN song_fuzzy_matches s ON s.id = sk.song_id
                where s.similarity >= 40
                ORDER BY s.similarity DESC
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerSimilar(String keyword);

    // 한글 우선검색 =====================================================================================

    @Query(value = """
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info, sk.title as title_korean
            FROM song s
                JOIN song_korean sk ON s.id = sk.song_id
            WHERE sk.singer_prior LIKE '%' || :keyword || '%'
            ORDER BY s.reg_date DESC
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerPrior(String keyword);


    // 한글검색 =======================================================================================
    @Query(value = """
            WITH song_korean_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, FUZZY_MATCH(LEVENSHTEIN, SK.TITLE, :keyword) as similarity
                FROM SONG_KOREAN sk
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO, sk.title as title_korean, sk.similarity
            FROM SONG s
                     JOIN song_korean_fuzzy_matches sk ON s.id = sk.song_id
            WHERE sk.similarity >= 40
            ORDER BY sk.similarity DESC
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanTitleSimilar(String keyword);

    // title_read similarity 검색의 경우 높은 정확도의 결과만 가져오기 위해 similarity 0.5 이상인 결과만 가져옴
    @Query(value = """
            WITH song_korean_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, FUZZY_MATCH(LEVENSHTEIN, SK.TITLE_READ, :keyword) as similarity
                FROM SONG_KOREAN sk
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO, sk.title as title_korean, sk.similarity
            FROM SONG s
                     JOIN song_korean_fuzzy_matches sk ON s.id = sk.song_id
            where sk.similarity >= 55
            ORDER BY sk.similarity DESC
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanTitleReadSimilar(String keyword);

    @Query(value = """
            WITH song_korean_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, FUZZY_MATCH(LEVENSHTEIN, SK.SINGER, :keyword) as similarity
                FROM SONG_KOREAN sk
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO, sk.title as title_korean, sk.similarity
            FROM SONG s
                     JOIN song_korean_fuzzy_matches sk ON s.id = sk.song_id
            where sk.similarity >= 40
            ORDER BY sk.similarity DESC
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanSingerSimilar(String keyword);

    @Query(value = """
            WITH song_korean_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, FUZZY_MATCH(LEVENSHTEIN, SK.SINGER_READ, :keyword) as similarity
                FROM SONG_KOREAN sk
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO, sk.title as title_korean, sk.similarity
            FROM SONG s
                     JOIN song_korean_fuzzy_matches sk ON s.id = sk.song_id
            where sk.similarity >= 55
            ORDER BY sk.similarity DESC
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanSingerReadSimilar(String keyword);

    // 추가검색 ===========================================================================================
    // 추가검색은 언어 구별 없이 한번에 구현함 (원어, 한글, 한글read 동시 검색)

    @Query(value = """
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info, sk.title as title_korean FROM song s
                JOIN song_korean sk ON s.id = sk.song_id 
            WHERE sk.title_origin LIKE '%' || :keyword || '%'
                           OR sk.title LIKE '%' || :keyword || '%'
                           OR sk.title_read LIKE '%' || :keyword || '%'
            order by s.reg_date desc
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByTitleLikeOriginOrKoreanOrRead(String keyword);

    @Query(value = """
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info, sk.title as title_korean FROM song s
                JOIN song_korean sk ON s.id = sk.song_id 
            WHERE sk.singer_origin LIKE '%' || :keyword || '%'
                           OR sk.singer LIKE '%' || :keyword || '%'
                           OR sk.singer_read LIKE '%' || :keyword || '%'
            order by s.reg_date desc
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerLikeOriginOrKoreanOrRead(String keyword);


}
