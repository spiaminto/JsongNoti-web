package com.jsongnoti.jsongnoti_web.auth;

import com.jsongnoti.jsongnoti_web.domain.User;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@Data
@Slf4j
@RequiredArgsConstructor
/**
 * SpringSecurity 일반 유저와 OAuth2 유저 정보를 모두 담을수 있는 클래스.
 * Authentication - PrincipalDetails - User
 */
public class PrincipalDetails implements OAuth2User {

    private final User user;
    // OAuth2User.getAttributes() 로 받은 정보
    private final Map<String, Object> attributes;

//    public PrincipalDetails(User member) {
//        this.member = member;
//        this.attributes = null;
//    }
    public PrincipalDetails(User user) {
        this.user = user;
        this.attributes = null;
    }

    // 권한 리턴
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> collection = new ArrayList<>();

        collection.add(new GrantedAuthority() {
            @Override
            public String getAuthority() {
                return user.getRole();
            }
        });

        return collection;
    }

    public String getUsername() {
        return user.getEmail();
    }


    public String getEmail() {
        return user.getEmail();
    }

    @Override
    public String getName() {
        return user.getId() + "";
    } // OAuth2User, user PK

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    } // OAuth2User


}
