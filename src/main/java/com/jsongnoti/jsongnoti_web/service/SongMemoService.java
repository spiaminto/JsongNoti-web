package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.Brand;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.domain.SongMemo;
import com.jsongnoti.jsongnoti_web.repository.SongMemoRepository;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.service.dto.MemoSearchCond;
import com.jsongnoti.jsongnoti_web.service.dto.SongMemoServiceResult;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class SongMemoService {

    private final SongMemoRepository songMemoRepository;
    private final SongRepository songRepository;

    public SongMemoServiceResult searchMemos(MemoSearchCond searchCond) {
        // presentType 처리 필요
        List<SongMemo> songMemos = songMemoRepository.findByBrandOrderByPresentOrderAsc(searchCond.getBrand());
        return SongMemoServiceResult.successWithMemos("조회 성공", songMemos);
    }

    @Transactional
    public SongMemoServiceResult saveMemo(Long userId, Long songId, String infoText, int presentOrder) {
        // 노래 및 순서 조회
        Song song = songRepository.findById(songId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 곡입니다."));
        String info = infoText.isBlank() ? song.getInfo() : infoText; // 입력한 info 없으면 기존 info 사용
        
        // 중복확인
        SongMemo findSongMemo = songMemoRepository.findByUserIdAndBrandAndNumber(userId, song.getBrand(), song.getNumber());
        if (findSongMemo != null) {
            return SongMemoServiceResult.fail("이미 메모가 존재합니다.");
        }

        // 순서 미리 변경
        long memoCount = songMemoRepository.countByUserId(userId);
        if (memoCount != presentOrder) {
            syncPresentOrder(userId, presentOrder, "save");
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

        return SongMemoServiceResult.success("메모가 저장되었습니다.");
    }

    @Transactional
    public SongMemoServiceResult deleteMemo(Long userId, Long memoId) {
        // 검증
        SongMemo findMemo = songMemoRepository.findById(memoId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 메모입니다."));
        if (!findMemo.getUserId().equals(userId)) {
            return SongMemoServiceResult.fail("잘못된 요청입니다.");
        }
        // 작업
        songMemoRepository.deleteById(memoId);
        // 반환
        syncPresentOrder(userId, findMemo.getPresentOrder(), "delete");
        return SongMemoServiceResult.success("메모가 삭제되었습니다.");
    }

    /**
     * 저장 또는 삭제시 순서를 조정할 때 사용
     * @param userId
     * @param presentOrder
     * @param action "save" or "delete"
     */
    private void syncPresentOrder(Long userId, int presentOrder, String action) {
        int orderModifier = action.equals("save") ? 1 : -1;
        songMemoRepository.findByUserIdAndPresentOrderGreaterThanEqual(userId, presentOrder)
                .forEach(memo -> {
                    memo.setPresentOrder(memo.getPresentOrder() + orderModifier);
                });
    }

    /**
     * 사용자의 순서변경을 통해 변경된 모든 순서 변경
     * @param userId
     * @param memoIds
     * @param brand
     */
    @Transactional
    public SongMemoServiceResult reorder(Long userId, List<Long> memoIds, Brand brand) {
        List<SongMemo> songMemos = songMemoRepository.findByUserIdAndBrand(userId, brand); // 메모의 갯수가 많아지면 memoIds 로 조회하도록 변경
        // 검증
        if (songMemos.size() != memoIds.size()) {
            // 들어온 갯수와 실제 갯수가 다름 (다른 브랜드가 섞여들어옴 or 중복된 id 가 들어옴)
            return SongMemoServiceResult.fail("잘못된 요청입니다."); 
        }
        // 순서 매핑
        Map<Long, Integer> memoIdOrderMap = IntStream.range(0, memoIds.size())
                .boxed()
                .collect(Collectors.toMap(memoIds::get, Function.identity())); // numbers 에 중복이 있을경우 key 중복으로 에러남
        // 순서를 전부 재조정 
        songMemos.forEach(memo -> {
            Integer order = memoIdOrderMap.get(memo.getId());
            if (order != null) {
                memo.setPresentOrder(order);
            }
        });
        return SongMemoServiceResult.success("순서가 변경되었습니다.");
    }



}
