package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.mail.GmailSender;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final GmailSender gmailSender;

    public ResultDto addUser(String email) {
        User findUser = userRepository.findByEmail(email);

        if (findUser != null) {
            // 등록 + 미인증 유저
            if (findUser.isVerified()) {
                return ResultDto.builder().hasError(true).message("이미 인증된 이메일입니다.").build();
            }
            if (findUser.getAuthenticationTimestamp() != null &&
                    findUser.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
                return ResultDto.builder().hasError(true).message("이미 인증 메일을 발송했습니다. 잠시 후 다시 시도해주세요.").build();
            }
            findUser.setAuth(); // 인증 토큰, 토큰만료시간 갱신
            gmailSender.sendVerifyMail(findUser.getId(), findUser.getEmail(), findUser.getAuthenticationToken());

        } else {
            // 미등록 유저
            User user = User.builder()
                    .email(email)
                    .build();
            user.setAuth(); // 인증 토큰, 토큰만료시간 갱신
            User savedUser = userRepository.save(user);
            gmailSender.sendVerifyMail(savedUser.getId(), savedUser.getEmail(), savedUser.getAuthenticationToken());
        }

        return ResultDto.builder().hasError(false).message("인증메일이 발송되었습니다. 확인해주세요.").build();
    }

    public ResultDto verifyAddUser(Long userId, String authenticationToken) {
        Optional<User> findUserOptional = userRepository.findById(userId);

        // 검증
        if (findUserOptional.isEmpty())
            return ResultDto.builder().hasError(true).message("가입되지 않은 이메일입니다.").build();
        User findUser = findUserOptional.get();
        if (findUser.isVerified())
            return ResultDto.builder().hasError(true).message("이미 인증된 이메일입니다.").build();
        if (!findUser.getAuthenticationToken().equals(authenticationToken))
            return ResultDto.builder().hasError(true).message("인증 토큰이 일치하지 않습니다.").build();
        if (findUser.getAuthenticationTimestamp().isBefore(LocalDateTime.now().minusMinutes(30)))
            return ResultDto.builder().hasError(true).message("인증 시간이 만료되었습니다.").build();

        // 인증
        findUser.verify();

        return ResultDto.builder().hasError(false).message("이메일 인증이 완료되었습니다.").build();
    }

    public ResultDto deleteUser(String email) {
        User findUser = userRepository.findByEmail(email);

        if (findUser == null || !findUser.isVerified()) {
            return ResultDto.builder().hasError(true).message("가입되지 않은 이메일입니다.").build();
        }
        if (findUser.getAuthenticationTimestamp() != null &&
                findUser.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
            return ResultDto.builder().hasError(true).message("이미 인증메일을 발송했습니다. 1분 후에 다시 시도해주세요.").build();
        }

        findUser.setAuth(); // 인증 토큰, 토큰만료시간 갱신

        gmailSender.sendDeleteMail(findUser.getId(), findUser.getEmail(), findUser.getAuthenticationToken());

        return ResultDto.builder().hasError(false).message("구독취소 인증메일이 발송되었습니다. 확인해주세요.").build();
    }

    public ResultDto verifyDeleteUser(Long userId, String authenticationToken) {
        Optional<User> findUserOptional = userRepository.findById(userId);

        // 검증
        if (findUserOptional.isEmpty())
            return ResultDto.builder().hasError(true).message("가입되지 않은 이메일입니다.").build();
        User findUser = findUserOptional.get();
        if (!findUser.isVerified())
            return ResultDto.builder().hasError(true).message("가입되지 않은 이메일입니다.").build();
        if (!findUser.getAuthenticationToken().equals(authenticationToken))
            return ResultDto.builder().hasError(true).message("인증 토큰이 일치하지 않습니다.").build();
        if (findUser.getAuthenticationTimestamp().isBefore(LocalDateTime.now().minusMinutes(5)))
            return ResultDto.builder().hasError(true).message("인증 시간이 만료되었습니다.").build();

        // 삭제
        userRepository.delete(findUser);

        return ResultDto.builder().hasError(false).message("구독취소가 완료되었습니다. 이용해주셔서 감사합니다.").build();
    }


}
