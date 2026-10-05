package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.domain.Subscription;
import com.jsongnoti.jsongnoti_web.mail.GmailSender;
import com.jsongnoti.jsongnoti_web.repository.SubscriptionRepository;
import com.jsongnoti.jsongnoti_web.service.result.SubscriptionServiceResult;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
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
    public SubscriptionServiceResult subscribe(String email) {
        // 구독자 수 제한
        long totalCount = subscriptionRepository.count();
        if (totalCount > 100) {
            return SubscriptionServiceResult.fail("죄송해요. 지금은 구독자가 많아 더 구독할 수 없어요.", null);
        }

        Optional<Subscription> findUserOptional = subscriptionRepository.findByEmail(email);
        Subscription processedSubscription = null;

        // 검증 또는 생성 및 인증정보 갱신
        if (findUserOptional.isPresent()) {
            // 등록 + 미인증 유저 -> 검증
            Subscription findSubscription = findUserOptional.get();
            if (findSubscription.isVerified()) {
                return SubscriptionServiceResult.fail("이미 인증된 이메일이에요.", findSubscription.getId());
            }
            if (findSubscription.getAuthenticationTimestamp() != null &&
                    findSubscription.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
                return SubscriptionServiceResult.fail("이미 인증 메일을 보냈어요. 1분 뒤에 다시 시도해 주세요.", findSubscription.getId());
            }

            // 인증 토큰, 토큰만료시간 갱신
            findSubscription.setAuth();
            processedSubscription = findSubscription;
        } else {
            // 미등록 유저 -> 생성
            Subscription subscription = Subscription.builder()
                    .email(email)
                    .build();

            // 인증 토큰, 토큰만료시간 갱신
            subscription.setAuth();

            processedSubscription = subscriptionRepository.save(subscription);
        }

        gmailSender.sendVerifyMail(processedSubscription.getEmail(), processedSubscription.getAuthenticationToken(), GmailSender.VerifyMailType.SUBSCRIBE);
        return SubscriptionServiceResult.success("인증 메일을 보냈어요. 메일을 확인해 주세요.", processedSubscription.getId());
    }

    /**
     * 추가한 유저의 인증코드를 확인하여 인증상태를 변경합니다.
     * @param userId
     * @param authenticationToken
     * @return
     */
    public SubscriptionServiceResult verifySubscription(Long userId, String authenticationToken) {
        Optional<Subscription> findUserOptional = subscriptionRepository.findById(userId);

        // 검증
        ValidateVerifyResult validateVerifyResult = validateVerifyRequest(findUserOptional, RequestType.ADD);
        if (validateVerifyResult.isError()) {
            return SubscriptionServiceResult.fail(validateVerifyResult.message, userId);
        }

        // 인증 코드 확인
        Subscription findSubscription = findUserOptional.get();
        if (!findSubscription.getAuthenticationToken().equals(authenticationToken)) {
            findSubscription.verificationFailed();
            return SubscriptionServiceResult.fail("인증코드가 일치하지 않아요. 3회 넘게 틀리면 인증을 다시 요청해야 해요. " + "(" + findSubscription.getAuthenticationRetry() + "회 실패" + ")", userId);
        }

        // 인증
        findSubscription.verify();

        return SubscriptionServiceResult.success("이메일 인증이 끝났어요. \n이제 신곡이 등록되면 알림 메일을 받을 수 있어요.", userId);
    }

    /**
     * 유저를 삭제하고 인증메일을 발송합니다.
     * @param email
     * @return
     */
    public SubscriptionServiceResult unsubscribe(String email) {
        Optional<Subscription> findUserOptional = subscriptionRepository.findByEmail(email);
        Subscription findSubscription = findUserOptional.orElse(null);
        
        // 검증
        if (findSubscription == null || !findSubscription.isVerified()) {
            return SubscriptionServiceResult.fail("가입되지 않은 이메일이에요.", null);
        }
        if (findSubscription.getAuthenticationTimestamp() != null &&
                findSubscription.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
            return SubscriptionServiceResult.fail("이미 인증 메일을 보냈어요. 1분 뒤에 다시 시도해 주세요.", findSubscription.getId());
        }

        // 인증 토큰, 토큰만료시간 갱신
        findSubscription.setAuth();

        gmailSender.sendVerifyMail(findSubscription.getEmail(), findSubscription.getAuthenticationToken(), GmailSender.VerifyMailType.UNSUBSCRIBE);

        return SubscriptionServiceResult.success("구독 취소 인증 메일을 보냈어요. 메일을 확인해 주세요.", findSubscription.getId());
    }

    /**
     * 삭제한 유저의 인증코드를 확인하여 삭제합니다.
     * @param userId
     * @param authenticationToken
     * @return
     */
    public SubscriptionServiceResult verifyUnsubscription(Long userId, String authenticationToken) {
        Optional<Subscription> findUserOptional = subscriptionRepository.findById(userId);

        // 검증
        ValidateVerifyResult validateVerifyResult = validateVerifyRequest(findUserOptional, RequestType.DELETE);
        if (validateVerifyResult.isError()) {
            return SubscriptionServiceResult.fail(validateVerifyResult.message, userId);
        }

        // 인증 코드 확인
        Subscription findSubscription = findUserOptional.get();
        if (!findSubscription.getAuthenticationToken().equals(authenticationToken)) {
            findSubscription.verificationFailed();
            return SubscriptionServiceResult.fail("인증코드가 일치하지 않아요. 3회 넘게 틀리면 인증을 다시 요청해야 해요. " + "(" + findSubscription.getAuthenticationRetry() + "회 실패" + ")", userId);
        }

        // 삭제
        subscriptionRepository.delete(findSubscription);

        return SubscriptionServiceResult.success("구독 취소가 끝났어요. 이용해 주셔서 감사해요.", userId);
    }

    /**
     * 인증 요청 검증
     * @param userOptional
     * @param requestType 요청 타입 (ADD, DELETE)
     * @return ValidateVerifyResult
     */
    protected ValidateVerifyResult validateVerifyRequest(Optional<Subscription> userOptional, RequestType requestType) {
        if (userOptional.isEmpty()) {
            return ValidateVerifyResult.fail("가입되지 않은 이메일이에요.");
        } else {
            Subscription subscription = userOptional.get();
            if (requestType == RequestType.ADD && subscription.isVerified()) {
                return ValidateVerifyResult.fail("이미 인증된 이메일이에요.");
            }
            if (requestType == RequestType.DELETE && !subscription.isVerified()) {
                return ValidateVerifyResult.fail("가입되지 않은 이메일이에요.");
            }
            if (subscription.getAuthenticationTimestamp().isBefore(LocalDateTime.now().minusMinutes(5))) {
                return ValidateVerifyResult.fail("인증 시간이 지났어요. 인증을 다시 요청해 주세요.");
            }
            if (subscription.getAuthenticationRetry() >= 3) {
                return ValidateVerifyResult.fail("인증 시도 횟수를 넘었어요. 인증을 다시 요청해 주세요.");
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
