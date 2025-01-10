package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.auth.oauth.Oauth2UserService;
import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.mail.GmailSender;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import com.jsongnoti.jsongnoti_web.service.dto.UserUpdateParam;
import com.jsongnoti.jsongnoti_web.service.result.UserServiceResult;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GmailSender gmailSender;
    private final Oauth2UserService oauth2UserService;


    public User findUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public UserServiceResult updateUser(Long userId, UserUpdateParam updateParam) {
        // ...

        UserServiceResult userServiceResult = updateMemoSetting(userId, updateParam);
        return userServiceResult;
    }

    @Transactional
    protected UserServiceResult updateMemoSetting(Long userId, UserUpdateParam updateParam) {
        // 검증
        if (updateParam.getFavoriteSongPresentType() == null || updateParam.getFavoriteSongPresentBrand() == null) {
            return UserServiceResult.fail("애창곡 설정을 변경할 수 없습니다.");
        }

        // 메모 설정 업데이트
        User user = findUserById(userId);
        user.updateMemoSetting(updateParam.getFavoriteSongPresentType(), updateParam.getFavoriteSongPresentBrand());
        return UserServiceResult.success("애창곡 설정이 변경되었습니다.");
    }

    /**
     * 유저를 삭제하고 인증메일을 발송합니다.
     *
     * @param email
     * @return
     */
    @Transactional
    public UserServiceResult requestDeleteUser(Long userId, String email) {
        User findUser = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다.")); // 시큐리티에서 검증하고 들어오지만 일단 방어
        // 검증
        if (!findUser.getEmail().equals(email)) {
            return UserServiceResult.fail("이메일이 일치하지 않습니다.");
        }
        if (findUser.getAuthenticationTimestamp() != null &&
                findUser.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
            return UserServiceResult.fail("이미 인증메일을 발송했습니다. 1분 후에 다시 시도해주세요.");
        }

        // 인증 토큰, 토큰만료시간 갱신
        findUser.setAuth();

        gmailSender.sendVerifyMail(findUser.getEmail(), findUser.getAuthenticationToken(), GmailSender.VerifyMailType.DELETE_USER);

        return UserServiceResult.success("회원탈퇴 인증 메일이 발송되었습니다. 확인해주세요.");
    }

    /**
     * 삭제한 유저의 인증코드를 확인하여 삭제합니다.
     *
     * @param userId
     * @param authenticationToken
     * @return
     */
    @Transactional
    public UserServiceResult verifyDeleteUser(Long userId, String authenticationToken, String oauth2AccessToken) {
        User findUser = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다.")); // 시큐리티에서 검증하고 들어오지만 일단 방어

        // 검증
        if (findUser.getAuthenticationRetry() >= 3) {
            return UserServiceResult.fail("인증 시도 횟수를 초과했습니다. 다시 인증요청 해주세요.");
        }
        if (findUser.getAuthenticationTimestamp().isBefore(LocalDateTime.now().minusMinutes(5))) {
            return UserServiceResult.fail("인증 시간이 만료되었습니다. 다시 인증요청 해주세요.");
        }

        // 인증 코드 확인
        if (!findUser.getAuthenticationToken().equals(authenticationToken)) {
            findUser.verificationFailed();
            return UserServiceResult.fail("인증코드가 일치하지 않습니다. 실패횟수가 3회를 초과하면 다시 인증요청 해야합니다." + "(" + findUser.getAuthenticationRetry() + "회 실패" + ")");
        }

        // accessToken revoke
        if (!oauth2UserService.revokeAccessToken(oauth2AccessToken)) {
            return UserServiceResult.fail("구글 로그인 동의 철회중 문제가 발생했습니다. 재 로그인 해주세요.");
        }

        // 삭제
        userRepository.delete(findUser);

        return UserServiceResult.success("회원탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
    }

}
