package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.mail.GmailSender;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final GmailSender gmailSender;

    /**
     * 요청 타입
     */
    protected enum RequestType {
        ADD, DELETE
    }

    /**
     * 유저를 추가하고 인증메일을 발송합니다.
     * @param email
     * @return
     */
    public UserServiceResult addUser(String email) {
        // 구독자 수 제한
        long totalCount = userRepository.count();
        if (totalCount > 100) {
            return UserServiceResult.fail("죄송합니다. 현재 구독자수가 많아 추가 구독이 어렵습니다.", null);
        }

        Optional<User> findUserOptional = userRepository.findByEmail(email);
        User processedUser = null;

        // 검증 또는 생성 및 인증정보 갱신
        if (findUserOptional.isPresent()) {
            // 등록 + 미인증 유저 -> 검증
            User findUser = findUserOptional.get();
            if (findUser.isVerified()) {
                return UserServiceResult.fail("이미 인증된 이메일입니다.", findUser.getId());
            }
            if (findUser.getAuthenticationTimestamp() != null &&
                    findUser.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
                return UserServiceResult.fail("이미 인증메일을 발송했습니다. 1분 후에 다시 시도해주세요.", findUser.getId());
            }

            // 인증 토큰, 토큰만료시간 갱신
            findUser.setAuth();
            processedUser = findUser;
        } else {
            // 미등록 유저 -> 생성
            User user = User.builder()
                    .email(email)
                    .build();

            // 인증 토큰, 토큰만료시간 갱신
            user.setAuth();

            processedUser = userRepository.save(user);
        }

        gmailSender.sendVerifyMail(processedUser.getEmail(), processedUser.getAuthenticationToken());
        return UserServiceResult.success("이메일 인증 메일이 발송되었습니다. 확인해주세요.", processedUser.getId());
    }

    /**
     * 추가한 유저의 인증코드를 확인하여 인증상태를 변경합니다.
     * @param userId
     * @param authenticationToken
     * @return
     */
    public UserServiceResult verifyAddUser(Long userId, String authenticationToken) {
        Optional<User> findUserOptional = userRepository.findById(userId);

        // 검증
        ValidateVerifyResult validateVerifyResult = validateVerifyRequest(findUserOptional, RequestType.ADD);
        if (validateVerifyResult.isError()) {
            return UserServiceResult.fail(validateVerifyResult.message, userId);
        }

        // 인증 코드 확인
        User findUser = findUserOptional.get();
        if (!findUser.getAuthenticationToken().equals(authenticationToken)) {
            findUser.verificationFailed();
            return UserServiceResult.fail("인증 토큰이 일치하지 않습니다. 3회 이상 실패하면 다시 인증요청 해야합니다. " + "(" + findUser.getAuthenticationRetry() + "회 실패" + ")", userId);
        }

        // 인증
        findUser.verify();

        return UserServiceResult.success("이메일 인증이 완료되었습니다. 이제 신곡이 등록되면 알림 메일을 받아보실 수 있습니다.", userId);
    }

    /**
     * 유저를 삭제하고 인증메일을 발송합니다.
     * @param email
     * @return
     */
    public UserServiceResult deleteUser(String email) {
        Optional<User> findUserOptional = userRepository.findByEmail(email);
        User findUser = findUserOptional.orElse(null);
        
        // 검증
        if (findUser == null || !findUser.isVerified()) {
            return UserServiceResult.fail("가입되지 않은 이메일입니다.", null);
        }
        if (findUser.getAuthenticationTimestamp() != null &&
                findUser.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
            return UserServiceResult.fail("이미 인증메일을 발송했습니다. 1분 후에 다시 시도해주세요.", findUser.getId());
        }

        // 인증 토큰, 토큰만료시간 갱신
        findUser.setAuth();

        gmailSender.sendDeleteMail(findUser.getEmail(), findUser.getAuthenticationToken());

        return UserServiceResult.success("구독취소 인증 메일이 발송되었습니다. 확인해주세요.", findUser.getId());
    }

    /**
     * 삭제한 유저의 인증코드를 확인하여 삭제합니다.
     * @param userId
     * @param authenticationToken
     * @return
     */
    public UserServiceResult verifyDeleteUser(Long userId, String authenticationToken) {
        Optional<User> findUserOptional = userRepository.findById(userId);

        // 검증
        ValidateVerifyResult validateVerifyResult = validateVerifyRequest(findUserOptional, RequestType.DELETE);
        if (validateVerifyResult.isError()) {
            return UserServiceResult.fail(validateVerifyResult.message, userId);
        }

        // 인증 코드 확인
        User findUser = findUserOptional.get();
        if (!findUser.getAuthenticationToken().equals(authenticationToken)) {
            findUser.verificationFailed();
            return UserServiceResult.fail("인증 토큰이 일치하지 않습니다. 실패횟수가 3회를 초과하면 다시 인증요청 해야합니다." + "(" + findUser.getAuthenticationRetry() + "회 실패" + ")", userId);
        }

        // 삭제
        userRepository.delete(findUser);

        return UserServiceResult.success("구독취소가 완료되었습니다. 이용해주셔서 감사합니다.", userId);
    }

    /**
     * 인증 요청 검증
     * @param userOptional
     * @param requestType 요청 타입 (ADD, DELETE)
     * @return ValidateVerifyResult
     */
    protected ValidateVerifyResult validateVerifyRequest(Optional<User> userOptional, RequestType requestType) {
        if (userOptional.isEmpty()) {
            return ValidateVerifyResult.fail("가입되지 않은 이메일입니다.");
        } else {
            User user = userOptional.get();
            if (requestType == RequestType.ADD && user.isVerified()) {
                return ValidateVerifyResult.fail("이미 인증된 이메일입니다.");
            }
            if (requestType == RequestType.DELETE && !user.isVerified()) {
                return ValidateVerifyResult.fail("가입되지 않은 이메일입니다.");
            }
            if (user.getAuthenticationTimestamp().isBefore(LocalDateTime.now().minusMinutes(5))) {
                return ValidateVerifyResult.fail("인증 시간이 만료되었습니다. 다시 인증요청 해주세요.");
            }
            if (user.getAuthenticationRetry() > 2) {
                return ValidateVerifyResult.fail("인증 시도 횟수를 초과했습니다. 다시 인증요청 해주세요.");
            }
        }
        return ValidateVerifyResult.success("검증성공");

    }

    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    @Getter
    protected static class ValidateVerifyResult {

        private final boolean error;
        private final String message;

        public static ValidateVerifyResult success(String message) {
            return new ValidateVerifyResult(false, message);
        }
        public static ValidateVerifyResult fail(String message) {
            return new ValidateVerifyResult(true, message);
        }
    }

}
