<?php

class OAuthConfig {
    public static function getGoogleClientId() {
        return getenv('GOOGLE_CLIENT_ID') ?: '';
    }

    public static function getGoogleClientSecret() {
        return getenv('GOOGLE_CLIENT_SECRET') ?: '';
    }

    public static function getGoogleRedirectUri() {
        return getenv('GOOGLE_REDIRECT_URI') ?: '';
    }

    public static function getGoogleTokenInfoUrl() {
        return getenv('GOOGLE_TOKENINFO_URL') ?: '';
    }

    public static function getGoogleGsiScriptUrl() {
        return getenv('GOOGLE_GSI_SCRIPT_URL') ?: '';
    }

    public static function isGoogleEnabled() {
        return !empty(self::getGoogleClientId()) && !empty(self::getGoogleClientSecret());
    }
}
