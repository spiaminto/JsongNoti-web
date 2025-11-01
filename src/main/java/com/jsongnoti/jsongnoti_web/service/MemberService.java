package com.jsongnoti.jsongnoti_web.service;

import com.jsongnoti.jsongnoti_web.auth.oauth.Oauth2UserService;
import com.jsongnoti.jsongnoti_web.domain.Member;
import com.jsongnoti.jsongnoti_web.mail.GmailSender;
import com.jsongnoti.jsongnoti_web.repository.MemberRepository;
import com.jsongnoti.jsongnoti_web.service.dto.MemberUpdateParam;
import com.jsongnoti.jsongnoti_web.service.result.MemberServiceResult;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final GmailSender gmailSender;
    private final Oauth2UserService oauth2UserService;


    public Member findMemberById(Long id) {
        return memberRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public MemberServiceResult updateMember(Long userId, MemberUpdateParam updateParam) {
        // ....
        int number = 1;

        MemberServiceResult userServiceResult = updateMemoSetting(userId, updateParam);
        return userServiceResult;
    }

    @Transactional
    protected MemberServiceResult updateMemoSetting(Long userId, MemberUpdateParam updateParam) {
        // 검증
        if (updateParam.getFavoriteSongPresentType() == null || updateParam.getFavoriteSongPresentBrand() == null) {
            return MemberServiceResult.fail("애창곡 설정을 변경할 수 없습니다.");
        }

        // 메모 설정 업데이트
        Member member = findMemberById(userId);
        member.updateMemoSetting(updateParam.getFavoriteSongPresentType(), updateParam.getFavoriteSongPresentBrand());
        return MemberServiceResult.success("애창곡 설정이 변경되었습니다.");
    }

    /**
     * 유저를 삭제하고 인증메일을 발송합니다.
     *
     * @param email
     * @return
     */
    @Transactional
    public MemberServiceResult requestDeleteMember(Long userId, String email) {
        Member findMember = memberRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다.")); // 시큐리티에서 검증하고 들어오지만 일단 방어
        // 검증
        if (!findMember.getEmail().equals(email)) {
            return MemberServiceResult.fail("이메일이 일치하지 않습니다.");
        }
        if (findMember.getAuthenticationTimestamp() != null &&
                findMember.getAuthenticationTimestamp().isAfter(LocalDateTime.now().minusMinutes(1))) {
            return MemberServiceResult.fail("이미 인증메일을 발송했습니다. 1분 후에 다시 시도해주세요.");
        }

        // 인증 토큰, 토큰만료시간 갱신
        findMember.setAuth();

        gmailSender.sendVerifyMail(findMember.getEmail(), findMember.getAuthenticationToken(), GmailSender.VerifyMailType.DELETE_USER);

        return MemberServiceResult.success("회원탈퇴 인증 메일이 발송되었습니다. 확인해주세요.");
    }

    /**
     * 삭제한 유저의 인증코드를 확인하여 삭제합니다.
     *
     * @param userId
     * @param authenticationToken
     * @return
     */
    @Transactional
    public MemberServiceResult verifyDeleteMember(Long userId, String authenticationToken, String oauth2AccessToken) {
        Member findMember = memberRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다.")); // 시큐리티에서 검증하고 들어오지만 일단 방어

        // 검증
        if (findMember.getAuthenticationRetry() >= 3) {
            return MemberServiceResult.fail("인증 시도 횟수를 초과했습니다. 다시 인증요청 해주세요.");
        }
        if (findMember.getAuthenticationTimestamp().isBefore(LocalDateTime.now().minusMinutes(5))) {
            return MemberServiceResult.fail("인증 시간이 만료되었습니다. 다시 인증요청 해주세요.");
        }

        // 인증 코드 확인
        if (!findMember.getAuthenticationToken().equals(authenticationToken)) {
            findMember.verificationFailed();
            return MemberServiceResult.fail("인증코드가 일치하지 않습니다. 실패횟수가 3회를 초과하면 다시 인증요청 해야합니다." + "(" + findMember.getAuthenticationRetry() + "회 실패" + ")");
        }

        // accessToken revoke
        if (!oauth2UserService.revokeAccessToken(oauth2AccessToken)) {
            return MemberServiceResult.fail("구글 로그인 동의 철회중 문제가 발생했습니다. 재 로그인 해주세요.");
        }

        // 삭제
        memberRepository.delete(findMember);

        return MemberServiceResult.success("회원탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
    }

}
