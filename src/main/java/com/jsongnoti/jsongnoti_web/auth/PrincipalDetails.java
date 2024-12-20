package com.jsongnoti.jsongnoti_web.auth;

import com.jsongnoti.jsongnoti_web.domain.User;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;


@Slf4j
@RequiredArgsConstructor
@Getter @EqualsAndHashCode @ToString
/**
 * Authentication - PrincipalDetails - User
 */
public class PrincipalDetails implements OAuth2User, UserDetails {

    private final User user;
    private final Map<String, Object> attributes; // OAuth2User.getAttributes() 로 받은 정보

//    public PrincipalDetails(User user) {
//        this.user = user;
//        this.attributes = null;
//    }

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

    @Override
    public String getPassword() {
        return "";
    }

    public Long getUserId() { return user.getId(); }

    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }

    public String getEmail() {
        return user.getEmail();
    }

    /**
     * AuthenticatedPrincipal.getName() 으로 표시할 Principal 의 이름. 
     * 타임리프에서 #authenitcation을 통해 접근하여 표시하기 위해 user.id 를 노출
     * @return userId
     */
    @Override
    public String getName() {
        return user.getId() + "";
    } // OAuth2User, user PK

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    } // OAuth2User


}
