package com.jsongnoti.jsongnoti_web.config;

import com.jsongnoti.jsongnoti_web.interceptor.HttpLogInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
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

    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .requestFactory(getSimpleClientHttpRequestFactory())
                .build();
    }

    // UrlConnection 사용
    private SimpleClientHttpRequestFactory getSimpleClientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10 * 1000);
        factory.setReadTimeout(10 * 1000);
        return factory;
    }

}