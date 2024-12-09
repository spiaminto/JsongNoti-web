package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import com.jsongnoti.jsongnoti_web.service.dto.UserServiceResult;
import com.jsongnoti.jsongnoti_web.service.dto.UserUpdateParam;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User findUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }

    @Transactional
    public UserServiceResult updateUser(Long userId, UserUpdateParam updateParam) {
        // updateParam 을 이용하여 update 분류
        // ... (현재는 메모설정 업데이트 밖에 없음)

        // 메모 설정 업데이트
        User user = findUserById(userId);
        user.updateMemoSetting(updateParam.getMemoPresentType(), updateParam.getShowMemoBrand());
        return UserServiceResult.success("메모 설정이 변경되었습니다.");
    }

}
