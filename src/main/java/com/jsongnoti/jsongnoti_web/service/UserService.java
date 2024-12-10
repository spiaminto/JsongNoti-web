package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import com.jsongnoti.jsongnoti_web.service.dto.UserUpdateParam;
import com.jsongnoti.jsongnoti_web.service.result.UserServiceResult;
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
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public UserServiceResult updateUser(Long userId, UserUpdateParam updateParam) {
        // ...

        UserServiceResult userServiceResult = updateMemoSetting(userId, updateParam);
        return userServiceResult;
    }

    protected UserServiceResult updateMemoSetting(Long userId, UserUpdateParam updateParam) {
        // 검증
        if (updateParam.getMemoPresentType() == null || updateParam.getShowMemoBrand() == null) {
            return UserServiceResult.fail("메모 설정을 변경할 수 없습니다.");
        }

        // 메모 설정 업데이트
        User user = findUserById(userId);
        user.updateMemoSetting(updateParam.getMemoPresentType(), updateParam.getShowMemoBrand());
        return UserServiceResult.success("메모 설정이 변경되었습니다.");
    }

}
