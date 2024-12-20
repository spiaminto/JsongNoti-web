package com.jsongnoti.jsongnoti_web.auth.oauth.provider;

// OAuth 를 통해 받은 유저정보 가공
public interface OAuth2UserInfo {
	String getProvider(); // 서비스 제공자

	String getProviderId(); // 서비스 제공자 pk

	String getEmail();

	String getName();
}
