package com.jsongnoti.jsongnoti_web.repository;

import com.jsongnoti.jsongnoti_web.domain.SongKorean;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongKoreanRepository extends JpaRepository<SongKorean, Long> {
    List<SongKorean> findAllBySongIdIn(List<Long> songIdList);
}
