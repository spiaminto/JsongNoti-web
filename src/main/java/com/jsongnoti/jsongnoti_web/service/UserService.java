package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import com.jsongnoti.jsongnoti_web.service.dto.UserUpdateParam;
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

    public void updateUser(Long userId, UserUpdateParam userUpdateForm) {
        User user = findUserById(userId);
        user.updateUser(userUpdateForm);
    }

}
