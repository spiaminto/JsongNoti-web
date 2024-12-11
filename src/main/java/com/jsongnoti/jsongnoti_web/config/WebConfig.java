package com.jsongnoti.jsongnoti_web.config;

import com.jsongnoti.jsongnoti_web.interceptor.HttpLogInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        registry.addInterceptor(new HttpLogInterceptor())
                .order(1)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/**/static/**",
                        "/js/**",
                        "/css/**",
                        "/assets/**",
                        "https://maxcdn.bootstrapcdn.com/**"
                        );

    }
}