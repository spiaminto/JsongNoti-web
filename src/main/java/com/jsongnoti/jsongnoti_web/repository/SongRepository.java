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
            "ORDER BY s.regDate DESC, s.id")
    List<Song> findSongsByBrandBetweenTime(Brand brand, LocalDate startDate, LocalDate endDate);

    @Query("""
            SELECT new com.jsongnoti.jsongnoti_web.repository.SongWithKoreanDto(
                        s.brand, s.songNumber, s.title, sk.title, s.singer, sk.singer, s.info, sk.info, s.regDate
                        )
                         FROM Song s
                        LEFT JOIN SongKorean sk on s.id = sk.songId
            WHERE s.regDate >= :startDate AND s.regDate <= :endDate
            ORDER BY s.regDate DESC, s.id
            """)
    List<SongWithKoreanDto> findSongsBetweenTime(LocalDate startDate, LocalDate endDate);

//    @Query("SELECT s FROM Song s " +
//            "WHERE s.regDate >= :startDate " +
//            "AND s.regDate <= :endDate " +
//            "ORDER BY s.regDate DESC")
//    List<Song> findSongsBetweenTime(LocalDate startDate, LocalDate endDate);


    // 원어 검색 =========================================================================================
    // 유사도 검색 정규화: 표시용 컬럼에는 기호를 유지하고, FUZZY_MATCH 비교 시점에만 양쪽에서
    // REGEXP_REPLACE(LOWER(x), '[^[:alnum:]]', '') 로 문자·숫자만 남김 (기호·공백 제거, 한글·가나·한자 유지)
    // 규칙 변경 시 아래 FUZZY_MATCH 쿼리 전체를 함께 수정할 것
    //
    // 정렬: 모든 검색 쿼리는 동점(같은 유사도·같은 등록일) 순서 고정을 위해
    // 2차 정렬 키(reg_date DESC, id)를 함께 건다. 1차 키만 걸면 DB 가 동점 행의
    // 순서를 보장하지 않아 같은 검색이 호출마다 다른 순서를 반환한다

    @Query(value = """
                WITH song_fuzzy_matches AS (
                    SELECT s.*,
                           FUZZY_MATCH(LEVENSHTEIN,
                                   REGEXP_REPLACE(LOWER(s.TITLE), '[^[:alnum:]]', ''),
                                   REGEXP_REPLACE(LOWER(:keyword), '[^[:alnum:]]', '')
                           ) as similarity
                    FROM SONG s
                )
                SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO, s.similarity,
                       sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean
                FROM SONG_KOREAN sk
                         JOIN song_fuzzy_matches s ON s.id = sk.song_id
                where s.similarity >= 45
                ORDER BY s.similarity DESC, s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByTitleSimilar(String keyword);

    @Query(value = """
                WITH song_fuzzy_matches AS (
                    SELECT s.*,
                           FUZZY_MATCH(LEVENSHTEIN,
                                   REGEXP_REPLACE(LOWER(s.SINGER), '[^[:alnum:]]', ''),
                                   REGEXP_REPLACE(LOWER(:keyword), '[^[:alnum:]]', '')
                           ) as similarity
                    FROM SONG s
                )
                SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO, s.similarity,
                       sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean
                FROM SONG_KOREAN sk
                         JOIN song_fuzzy_matches s ON s.id = sk.song_id
                where s.similarity >= 45
                ORDER BY s.similarity DESC, s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerSimilar(String keyword);

    // 한글 우선검색 =====================================================================================

    @Query(value = """
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean,
                   sk.singer_prior as singer_prior
            FROM song s
                JOIN song_korean sk ON s.id = sk.song_id
            WHERE sk.singer_prior LIKE '%' || :keyword || '%'
            ORDER BY s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerPrior(String keyword);


    // 한글검색 =======================================================================================
    @Query(value = """
            WITH song_korean_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, sk.singer, sk.info,
                       FUZZY_MATCH(LEVENSHTEIN,
                               REGEXP_REPLACE(LOWER(SK.TITLE), '[^[:alnum:]]', ''),
                               REGEXP_REPLACE(LOWER(:keyword), '[^[:alnum:]]', '')
                       ) as similarity
                FROM SONG_KOREAN sk
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean, sk.similarity
            FROM SONG s
                     JOIN song_korean_fuzzy_matches sk ON s.id = sk.song_id
            WHERE sk.similarity >= 45
            ORDER BY sk.similarity DESC, s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanTitleSimilar(String keyword);

    // title_read similarity 검색의 경우 높은 정확도의 결과만 가져오기 위해 similarity 0.5 이상인 결과만 가져옴
    @Query(value = """
            WITH song_korean_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, sk.singer, sk.info,
                       FUZZY_MATCH(LEVENSHTEIN,
                               REGEXP_REPLACE(LOWER(SK.TITLE_READ), '[^[:alnum:]]', ''),
                               REGEXP_REPLACE(LOWER(:keyword), '[^[:alnum:]]', '')
                       ) as similarity
                FROM SONG_KOREAN sk
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean, sk.similarity
            FROM SONG s
                     JOIN song_korean_fuzzy_matches sk ON s.id = sk.song_id
            where sk.similarity >= 55
            ORDER BY sk.similarity DESC, s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanTitleReadSimilar(String keyword);

    @Query(value = """
            WITH song_korean_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, sk.singer, sk.info,
                       FUZZY_MATCH(LEVENSHTEIN,
                               REGEXP_REPLACE(LOWER(SK.SINGER), '[^[:alnum:]]', ''),
                               REGEXP_REPLACE(LOWER(:keyword), '[^[:alnum:]]', '')
                       ) as similarity
                FROM SONG_KOREAN sk
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean, sk.similarity
            FROM SONG s
                     JOIN song_korean_fuzzy_matches sk ON s.id = sk.song_id
            where sk.similarity >= 45
            ORDER BY sk.similarity DESC, s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanSingerSimilar(String keyword);

    @Query(value = """
            WITH song_korean_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, sk.singer, sk.info,
                       FUZZY_MATCH(LEVENSHTEIN,
                               REGEXP_REPLACE(LOWER(SK.SINGER_READ), '[^[:alnum:]]', ''),
                               REGEXP_REPLACE(LOWER(:keyword), '[^[:alnum:]]', '')
                       ) as similarity
                FROM SONG_KOREAN sk
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.SINGER, s.INFO,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean, sk.similarity
            FROM SONG s
                     JOIN song_korean_fuzzy_matches sk ON s.id = sk.song_id
            where sk.similarity >= 55
            ORDER BY sk.similarity DESC, s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanSingerReadSimilar(String keyword);

    // 작품 정보 검색 ====================================================================================

    @Query(value = """
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean,
                   sk.info_aliases as info_aliases
            FROM song s
                JOIN song_korean sk ON s.id = sk.song_id
            WHERE sk.info_aliases IS NOT NULL
              AND INSTR(
                    LOWER(REPLACE(sk.info_aliases, ' ', '')),
                    LOWER(REPLACE(:keyword, ' ', ''))
                  ) > 0
            ORDER BY CASE
                         WHEN LOWER(REPLACE(sk.info_aliases, ' ', '')) = LOWER(REPLACE(:keyword, ' ', '')) THEN 0
                         ELSE 1
                     END,
                     s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByInfoAliases(String keyword);

    @Query(value = """
            WITH song_korean_info_fuzzy_matches AS (
                SELECT sk.song_id, sk.title, sk.singer, sk.info,
                       FUZZY_MATCH(LEVENSHTEIN,
                               REGEXP_REPLACE(LOWER(sk.info), '[^[:alnum:]]', ''),
                               REGEXP_REPLACE(LOWER(:keyword), '[^[:alnum:]]', '')
                       ) as similarity
                FROM song_korean sk
                WHERE sk.info IS NOT NULL
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean, sk.similarity
            FROM song s
                JOIN song_korean_info_fuzzy_matches sk ON s.id = sk.song_id
            WHERE sk.similarity >= 45
            ORDER BY sk.similarity DESC, s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByKoreanInfoSimilar(String keyword);

    @Query(value = """
            WITH song_info_fuzzy_matches AS (
                SELECT s.*,
                       FUZZY_MATCH(LEVENSHTEIN,
                               REGEXP_REPLACE(LOWER(s.info), '[^[:alnum:]]', ''),
                               REGEXP_REPLACE(LOWER(:keyword), '[^[:alnum:]]', '')
                       ) as similarity
                FROM song s
                WHERE s.info IS NOT NULL
            )
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info, s.similarity,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean
            FROM song_korean sk
                JOIN song_info_fuzzy_matches s ON s.id = sk.song_id
            WHERE s.similarity >= 45
            ORDER BY s.similarity DESC, s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByInfoSimilar(String keyword);

    // 추가검색 ===========================================================================================
    // 추가검색은 언어 구별 없이 한번에 구현함 (원어, 한글, 한글read 동시 검색)

    @Query(value = """
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean FROM song s
                JOIN song_korean sk ON s.id = sk.song_id 
            WHERE sk.title_origin LIKE '%' || :keyword || '%'
                           OR sk.title LIKE '%' || :keyword || '%'
                           OR sk.title_read LIKE '%' || :keyword || '%'
            order by s.reg_date desc, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByTitleLikeOriginOrKoreanOrRead(String keyword);

    @Query(value = """
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean FROM song s
                JOIN song_korean sk ON s.id = sk.song_id 
            WHERE sk.singer_origin LIKE '%' || :keyword || '%'
                           OR sk.singer LIKE '%' || :keyword || '%'
                           OR sk.singer_read LIKE '%' || :keyword || '%'
            order by s.reg_date desc, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongBySingerLikeOriginOrKoreanOrRead(String keyword);

    @Query(value = """
            SELECT s.id, s.brand, s.song_number, s.title, s.singer, s.info,
                   sk.title as title_korean, sk.singer as singer_korean, sk.info as info_korean
            FROM song s
                JOIN song_korean sk ON s.id = sk.song_id
            WHERE LOWER(s.info) LIKE '%' || LOWER(:keyword) || '%'
               OR LOWER(sk.info) LIKE '%' || LOWER(:keyword) || '%'
               OR LOWER(sk.info_aliases) LIKE '%' || LOWER(:keyword) || '%'
            ORDER BY s.reg_date DESC, s.id
            """, nativeQuery = true)
    List<SongSearchResultDto> findSongByInfoLikeOriginOrKoreanOrAliases(String keyword);


}
