package com.jsongnoti.jsongnoti_web.config;

import com.jsongnoti.jsongnoti_web.auth.PrincipalDetails;
import com.jsongnoti.jsongnoti_web.auth.oauth.Oauth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.function.Supplier;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final Oauth2UserService oauth2UserService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // csrf 활성화

        http
                .sessionManagement(sessionManagement ->
                        sessionManagement
                                .sessionFixation().changeSessionId().invalidSessionUrl("/")
                                .maximumSessions(1).maxSessionsPreventsLogin(false).expiredUrl("/") // invalid 우선적용
                )

                .authorizeHttpRequests(authorizeRequests ->
                        authorizeRequests
                                .requestMatchers("/users/{userId}/**").access((authentication, context) ->
                                        new AuthorizationDecision(decideUsersAuthentication(authentication, context)))
                                // resources
                                .requestMatchers("/static/**", "/assets/**", "/css/**", "/js/**").permitAll()
                                // healthcheck
                                .requestMatchers("/health-check").permitAll()
                                // home
                                .requestMatchers("/").permitAll()
                                .anyRequest().permitAll()
                )

                .formLogin(formLogin ->
                        formLogin
                                .loginPage("/")
                )

                .logout(logout ->
                        logout
                                .permitAll()
                                .logoutUrl("/logout")
                                .logoutSuccessUrl("/")
                                .invalidateHttpSession(true)
                                .clearAuthentication(true))

                .oauth2Login(oauth2Login ->
                        oauth2Login
                                .authorizationEndpoint(authorizationEndpoint ->
                                        authorizationEndpoint.baseUri("/oauth2/authorization"))
                                .redirectionEndpoint(redirectionEndpoint ->
                                        redirectionEndpoint.baseUri("/oauth2/code/**"))
                                .loginPage("/login")
                                .defaultSuccessUrl("/favorite-song")
                                .userInfoEndpoint(userInfoEndpoint ->
                                        userInfoEndpoint.userService(oauth2UserService)));
        return http.build();
    }

    /**
     * /users/{userId} 요청에 대한 인증 처리 분리
     * 인증여부 (Authentication 의 Principal 존재여부) 와 pathVariable 의 userId 일치여부를 확인
     *
     * @param authentication access(authentication, context) 에서 제공된 Supplier<Authentication>
     * @param context        access(authentication, context) 에서 제공된 RequestAuthorizationContext
     * @return boolean 인증여부
     */
    private boolean decideUsersAuthentication(Supplier<Authentication> authentication, RequestAuthorizationContext context) {
        PrincipalDetails principalDetails = (PrincipalDetails) authentication.get().getPrincipal();
        String pathVariable = context.getVariables().get("userId"); // context.variables 는 matcher 정보중 {variable} 로 구성된 map
        return principalDetails != null && pathVariable != null && pathVariable.equals(principalDetails.getUserId().toString());
    }

}
