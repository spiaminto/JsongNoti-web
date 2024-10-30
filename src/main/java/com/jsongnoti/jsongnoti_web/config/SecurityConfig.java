package com.jsongnoti.jsongnoti_web.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // csrf 활성화

        http
                .authorizeHttpRequests(authorizeRequests ->
                        authorizeRequests
                                // resources
                                .requestMatchers("/static/**", "/assets/**", "/css/**", "/js/**").permitAll()
                                // healthcheck
                                .requestMatchers("/health-check").permitAll()
                                .requestMatchers("/", "/users/**").permitAll()
                                .anyRequest().permitAll()
                )
                // 미구현
                .formLogin(formLogin ->
                        formLogin
                                .loginPage("/login")
                                .permitAll()
                )
                // 미구현
                .logout(logout ->
                        logout
                                .logoutUrl("/logout")
                                .permitAll()
                );
        return http.build();
    }

}
