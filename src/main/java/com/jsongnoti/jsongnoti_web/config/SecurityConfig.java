package com.jsongnoti.jsongnoti_web.config;

import com.jsongnoti.jsongnoti_web.auth.oauth.PrincipalOauth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final PrincipalOauth2UserService principalOauth2UserService;

    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // csrf 활성화

        http
                .sessionManagement(sessionManagement ->
                    sessionManagement.maximumSessions(1)
                )

                .authorizeHttpRequests(authorizeRequests ->
                        authorizeRequests
                                // resources
                                .requestMatchers("/static/**", "/assets/**", "/css/**", "/js/**").permitAll()
                                // healthcheck
                                .requestMatchers("/health-check").permitAll()
                                .requestMatchers("/", "/users/**").permitAll()
                                .anyRequest().permitAll()
                )

                .formLogin(formLogin ->
                        formLogin
                                .loginPage("/login")
                )

                .logout(logout ->
                        logout
                                .permitAll()
                                .logoutUrl("/logout")
                                .logoutSuccessUrl("/login")
                                .deleteCookies("JSESSIONID")
                                .invalidateHttpSession(true)
                                .clearAuthentication(true))

                .oauth2Login(oauth2Login ->
                        oauth2Login
                                .authorizationEndpoint(authorizationEndpoint ->
                                        authorizationEndpoint.baseUri("/oauth2/authorization"))
                                .redirectionEndpoint(redirectionEndpoint ->
                                        redirectionEndpoint.baseUri("/oauth2/code/**"))
                                .loginPage("/login")
                                .defaultSuccessUrl("/memo")
                                .userInfoEndpoint(userInfoEndpoint ->
                                        userInfoEndpoint.userService(principalOauth2UserService)));
        return http.build();
    }

}
