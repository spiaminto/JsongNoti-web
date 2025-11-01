package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.FavoriteSong;
import com.jsongnoti.jsongnoti_web.domain.Song;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.repository.FavoriteSongRepository;
import com.jsongnoti.jsongnoti_web.repository.FavoriteSongWithKoreanDto;
import com.jsongnoti.jsongnoti_web.repository.SongRepository;
import com.jsongnoti.jsongnoti_web.service.dto.FavoriteSongSearchCond;
import com.jsongnoti.jsongnoti_web.service.result.FavoriteSongServiceResult;
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
public class FavoriteSongService {

    private final FavoriteSongRepository favoriteSongRepository;
    private final SongRepository songRepository;

    public FavoriteSongServiceResult searchFavoriteSongs(FavoriteSongSearchCond searchCond) {
        // presentType 처리 필요
        List<FavoriteSongWithKoreanDto> searchResults = switch (searchCond.getPresentType()) {
            case PRESENT_ORDER ->
                    favoriteSongRepository.findAllByMemberOrderByPresentOrder(searchCond.getMemberId(), searchCond.getBrand());
            case ARTIST ->
                    favoriteSongRepository.findAllByMemberOrderBySinger(searchCond.getMemberId(), searchCond.getBrand());
            default ->
                throw new IllegalArgumentException("잘못된 타입 입니다. FavoriteSongSearchType =  " + searchCond.getPresentType());
        };
        return FavoriteSongServiceResult.successWithSongs("조회 성공", searchResults);
    }

    @Transactional
    public FavoriteSongServiceResult saveFavoriteSong(Long userId, Long songId, String infoText, int presentOrder, boolean useDefaultText) {
        // 노래 및 순서 조회
        Song song = songRepository.findById(songId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 곡입니다."));
        String info = useDefaultText ? song.getInfo() : infoText; // 기본값 사용 체크시 기본값 사용
        
        // 중복확인
        FavoriteSong findFavoriteSong = favoriteSongRepository.findByMemberIdAndBrandAndSongNumber(userId, song.getBrand(), song.getSongNumber());
        if (findFavoriteSong != null) {
            return FavoriteSongServiceResult.fail("이미 해당 곡이 존재합니다.");
        }

        long favoriteSongCount = favoriteSongRepository.countByMemberId(userId);
        // 100개 이상 저장불가
        if (favoriteSongCount >= 100) {
            return FavoriteSongServiceResult.fail("현재 애창곡은 100개까지만 저장 가능합니다.");
        }
        // 순서 미리 변경
        if (favoriteSongCount != presentOrder) {
            syncPresentOrder(userId, presentOrder, song.getBrand(), "save");
        }

        FavoriteSong favoriteSong = FavoriteSong.builder()
                .memberId(userId)
                .songId(song.getId())
                .brand(song.getBrand())
                .songNumber(song.getSongNumber())
                .title(song.getTitle())
                .singer(song.getSinger())
                .info(info)
                .presentOrder(presentOrder)
                .build();
        favoriteSongRepository.save(favoriteSong);

        return FavoriteSongServiceResult.success("애창곡이 저장되었습니다.");
    }

    @Transactional
    public FavoriteSongServiceResult deleteFavoriteSong(Long userId, Long favoriteSongId) {
        // 검증
        FavoriteSong findFavoriteSong = favoriteSongRepository.findById(favoriteSongId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 곡입니다."));
        if (!findFavoriteSong.getMemberId().equals(userId)) {
            return FavoriteSongServiceResult.fail("잘못된 요청입니다.");
        }
        // 작업
        favoriteSongRepository.deleteById(favoriteSongId);
        // 반환
        syncPresentOrder(userId, findFavoriteSong.getPresentOrder(), findFavoriteSong.getBrand(), "delete");
        return FavoriteSongServiceResult.success("애창곡이 삭제되었습니다.");
    }

    /**
     * 저장 또는 삭제시 순서를 조정할 때 사용
     * @param userId
     * @param presentOrder
     * @param action "save" or "delete"
     */
    private void syncPresentOrder(Long userId, int presentOrder, Brand brand, String action) {
        int orderModifier = action.equals("save") ? 1 : -1;
        favoriteSongRepository.findByMemberIdAndBrandAndPresentOrderGreaterThanEqual(userId, brand, presentOrder)
                .forEach(favoriteSong -> {
                    favoriteSong.updatePresentOrder(favoriteSong.getPresentOrder() + orderModifier);
                });
    }

    /**
     * 사용자의 순서변경을 통해 변경된 모든 순서 변경
     * @param userId
     * @param favoriteSongIds
     * @param brand
     */
    @Transactional
    public FavoriteSongServiceResult reorder(Long userId, List<Long> favoriteSongIds, Brand brand) {
        List<FavoriteSong> favoriteSongs = favoriteSongRepository.findByMemberIdAndBrand(userId, brand); // 메모의 갯수가 많아지면 favoriteSongIds 로 조회하도록 변경
        // 검증
        if (favoriteSongs.size() != favoriteSongIds.size()) {
            // 들어온 갯수와 실제 갯수가 다름 (다른 브랜드가 섞여들어옴 or 중복된 id 가 들어옴)
            return FavoriteSongServiceResult.fail("잘못된 요청입니다.");
        }
        // 순서 매핑
        Map<Long, Integer> favoriteSongIdOrderMap = IntStream.range(0, favoriteSongIds.size())
                .boxed()
                .collect(Collectors.toMap(favoriteSongIds::get, Function.identity())); // numbers 에 중복이 있을경우 key 중복으로 에러남
        // 순서를 전부 재조정 
        favoriteSongs.forEach(favoriteSong -> {
            Integer order = favoriteSongIdOrderMap.get(favoriteSong.getId());
            if (order != null) {
                favoriteSong.updatePresentOrder(order);
            }
        });
        return FavoriteSongServiceResult.success("순서가 변경되었습니다.");
    }



}
