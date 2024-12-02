package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.domain.SongMemo;
import com.jsongnoti.jsongnoti_web.repository.SongMemoRepository;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SongMemoService {

    private final SongMemoRepository songMemoRepository;
    private final SongRepository songRepository;

    @Transactional
    public void saveMemo(Long userId, Long songId, String infoText, int presentOrder) {
        // 노래 및 순서 조회
        Song song = songRepository.findById(songId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 곡입니다."));
        String info = infoText.isBlank() ? song.getInfo() : infoText; // 입력한 info 없으면 기존 info 사용

        // 순서 미리 변경
        long memoCount = songMemoRepository.countByUserId(userId);
        if (memoCount != presentOrder) {
            syncPresentOrder(userId, presentOrder);
        }

        SongMemo songMemo = SongMemo.builder()
                .userId(userId)
                .brand(song.getBrand())
                .number(song.getNumber())
                .title(song.getTitle())
                .singer(song.getSinger())
                .info(info)
                .presentOrder(presentOrder)
                .build();

        songMemoRepository.save(songMemo);

        log.info("saveMemo");
    }

    public void syncPresentOrder(Long userId, int presentOrder) {
        songMemoRepository.findByUserIdAndPresentOrderGreaterThanEqual(userId, presentOrder)
                .forEach(memo -> {
                    memo.setPresentOrder(memo.getPresentOrder() + 1);
                });
    }



}
