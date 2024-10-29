package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.mail.GmailSender;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

@Controller
@Slf4j
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final GmailSender gmailSender;

    @PostMapping("/users")
    public ResponseEntity<String> addUser(@Validated @ModelAttribute SubscriptionDto subscriptionDto,
                                          BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body("이메일 형식이 올바르지 않습니다.");
        }

        log.info("email: {}", subscriptionDto.getEmail());
        String email = subscriptionDto.getEmail();

        User findUser = userRepository.findByEmail(email);

        // db에 이미 있는 이메일이면
        if (findUser != null) {
            if (findUser.isVerified()) {
                return ResponseEntity.ok().body("이미 인증된 이메일입니다.");
            }
            if (findUser.getAuthenticationTimestamp() != null &&
                    findUser.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
                return ResponseEntity.ok().body("이미 인증 메일을 발송했습니다. 1분 후에 다시 시도해주세요.");
            }
        }

        // 인증 토큰, 타임스탬프 생성
        String authenticationToken = UUID.randomUUID().toString();
        LocalDateTime authenticationTimestamp = LocalDateTime.now();

        User user = User.builder()
                .email(email)
                .authenticationToken(authenticationToken)
                .authenticationTimestamp(authenticationTimestamp)
                .build();
        userRepository.save(user);

        gmailSender.sendVerifyMail(user.getId(), user.getEmail(), user.getAuthenticationToken());

        return ResponseEntity.ok().body("인증 메일이 발송되었습니다. 확인해주세요.");
    }

    @Transactional
    @GetMapping("/users/{userId}/verify")
    public String verifySubscribe(@PathVariable(name = "userId") Long userId,
                                                  @RequestParam(name = "token") String authenticationToken,
                                                  RedirectAttributes redirectAttributes) {
        log.info("userId: {}, token: {}", userId, authenticationToken);

        User findUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        String alertMessage = "";
        // 검증
        if (findUser.isVerified()) alertMessage = "이미 인증된 이메일입니다.";
        if (!findUser.getAuthenticationToken().equals(authenticationToken)) alertMessage = "인증 토큰이 일치하지 않습니다.";
        if (findUser.getAuthenticationTimestamp().isBefore(LocalDateTime.now().minusMinutes(30))) alertMessage = "인증 시간이 만료되었습니다.";
        // 인증
        if (alertMessage.isEmpty()) {
            findUser.verify();
            alertMessage = "인증되었습니다.";
        }

        redirectAttributes.addFlashAttribute("alertMessage", alertMessage);

        return "redirect:/";
    }

    @Transactional
    @PostMapping("/users/delete")
    public ResponseEntity<String> deleteUser(@Validated @ModelAttribute UnSubscriptionDto unSubscriptionDto,
                                             BindingResult bindingResult) {

        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body("이메일 형식이 올바르지 않습니다.");
        }

        String email = unSubscriptionDto.getEmail();
        log.info("email: {}", email);

        User findUser = userRepository.findByEmail(email);

        if (findUser == null || !findUser.isVerified()) {
            return ResponseEntity.ok().body("가입되지 않은 이메일입니다.");
        }
        if (findUser.getAuthenticationTimestamp() != null &&
                findUser.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
            return ResponseEntity.ok().body("이미 인증 메일을 발송했습니다. 1분 후에 다시 시도해주세요.");
        }

        // 인증 토큰, 타임스탬프 생성
        String authenticationToken = UUID.randomUUID().toString();
        LocalDateTime authenticationTimestamp = LocalDateTime.now();

        // 인증 토큰, 타임스탬프 저장
        findUser.setAuth(authenticationToken, authenticationTimestamp);

        gmailSender.sendDeleteMail(findUser.getId(), findUser.getEmail(), findUser.getAuthenticationToken());

        return ResponseEntity.ok().body("구독 취소 메일이 전송되었습니다.");
    }

    @Transactional
    @GetMapping("/users/{userId}/delete")
    public String confirmDelete(@PathVariable(name = "userId") Long userId,
                                  @RequestParam(name = "token") String authenticationToken,
                                  RedirectAttributes redirectAttributes) {
        log.info("userId: {}, token: {}", userId, authenticationToken);

        User findUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        String alertMessage = "";
        // 검증
        if (!findUser.isVerified()) alertMessage = "가입되지 않은 이메일 입니다.";
        if (!findUser.getAuthenticationToken().equals(authenticationToken)) alertMessage = "인증 토큰이 일치하지 않습니다.";
        if (findUser.getAuthenticationTimestamp().isBefore(LocalDateTime.now().minusMinutes(5))) alertMessage = "인증 시간이 만료되었습니다.";
        // 인증
        if (alertMessage.isEmpty()) {
            userRepository.deleteById(findUser.getId());
            alertMessage = "구독 취소 완료되었습니다. 이용해주셔서 감사합니다.";
        }

        redirectAttributes.addFlashAttribute("alertMessage", alertMessage);

        return "redirect:/";
    }


}
