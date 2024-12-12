package com.jsongnoti.jsongnoti_web.auth.oauth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jsongnoti.jsongnoti_web.auth.PrincipalDetails;
import com.jsongnoti.jsongnoti_web.auth.oauth.provider.GoogleUserInfo;
import com.jsongnoti.jsongnoti_web.auth.oauth.provider.OAuth2UserInfo;
import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.domain.enums.Brand;
import com.jsongnoti.jsongnoti_web.domain.enums.MemoPresentType;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
/**
 * OAuth2 유저 인증 처리 클래스
 */
public class PrincipalOauth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;

    /**
     * OAuth2UserRequest 를 가공한 뒤 Authentication 객체에 저장할 멤버 정보를 담은 PrincipalDetails 반환
     * (PrincipalDetails implements Oauth2User)
     */
    @Override
    public PrincipalDetails loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 유저 로드
        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.info("OAuth2User.loadUser() userRequest = {}, oAuth2User={}", userRequest, oAuth2User);

        // provider 에 따라 가져온 유저정보
        OAuth2UserInfo oAuthUserInfo = getOAuthUserInfo(userRequest, oAuth2User);

        return processOAuth2User(oAuthUserInfo);
    }

    /**
     * Oauth2Request 로부터 provider 정보 추출후 해당 provider 에 맞는 OAuth2UserInfo 구현체 반환
     * @param request
     * @param user
     * @return 각 provider 에 맞는 OAuth2UserInfo 구현체 ( not null )
     * @throws OAuth2AuthenticationException 지원하지 않는 provider 의 로그인 요청 발생시
     */
    protected OAuth2UserInfo getOAuthUserInfo(OAuth2UserRequest request, OAuth2User user) {
        OAuth2UserInfo oAuth2UserInfo = null;
        if (request.getClientRegistration().getRegistrationId().equals("google")) {
            oAuth2UserInfo = new GoogleUserInfo(user.getAttributes());
        } else {
            throw new OAuth2AuthenticationException("지원하지 않는 로그인 요청");
        }
        return oAuth2UserInfo;
    }

    /**
     * super.loadUser() 로 불러온 OAuth2유저 정보를 provider 에 따라 구분하여 가공 후
     * 해당 멤버가 DB 에 존재하면 로그인
     * 해당 멤버가 DB 에 존재하지 않으면 회원가입
     * 을 위해 OAuth2User 를 기반으로 PrincipalDetails 생성 후 반환.
     */
    private PrincipalDetails processOAuth2User(OAuth2UserInfo oAuth2UserInfo) {
        // DB 에 OAuth2 유저 존재여부 조회
        Optional<User> findUserOptional =
                userRepository.findByProviderAndProviderId(oAuth2UserInfo.getProvider(), oAuth2UserInfo.getProviderId());

        User processedUser;
        if (findUserOptional.isPresent()) {
            // 로그인
            log.info("OAuth2 유저 로그인 {} - {} ", oAuth2UserInfo.getProvider(), oAuth2UserInfo.getProviderId());
            User findUser = findUserOptional.get();
            // 이메일 바뀌면 자동 갱신
            if (!oAuth2UserInfo.getEmail().equals(findUser.getEmail())) {
                log.info("OAuth2 유저 이메일 변경 {} - {} ", oAuth2UserInfo.getProvider(), oAuth2UserInfo.getProviderId());
                findUser.updateOauth2Email(oAuth2UserInfo.getEmail());
            }
            processedUser = findUser;

        } else {
            // 회원가입
            log.info("OAuth2 유저 회원가입, OAuth2UserInfo={}", oAuth2UserInfo);
            String forOauth2UserUsername = oAuth2UserInfo.getEmail().substring(0, oAuth2UserInfo.getEmail().indexOf('@')); //email 에서 @gmail.com 제외한 나머지

            User newUser = User.builder()
                    .email(oAuth2UserInfo.getEmail())
                    .username(forOauth2UserUsername)
                    .password("forOauth2UserPassword")
                    .role("ROLE_USER")
                    .provider(oAuth2UserInfo.getProvider())
                    .providerId(oAuth2UserInfo.getProviderId())
                    .memoPresentType(MemoPresentType.PRESENT_ORDER)
                    .showMemoBrand(Brand.TJ) //TODO 나중에 금영 구현하면 ALL 로 수정
                    .build();

            userRepository.save(newUser);
            processedUser = newUser;
        }

        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> oauth2Attributes = objectMapper.convertValue(oAuth2UserInfo, new TypeReference<>() {});

        return new PrincipalDetails(processedUser, oauth2Attributes);
    }

}
