const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const path = require('path');

console.log("firebase-functions/v2 kakaoCallback module loaded.");

process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";


const KAKAO_KEY = defineSecret("KAKAO_KEY");
const KAKAO_REDIRECT_URI_PROD = defineSecret("KAKAO_REDIRECT_URI_PROD");
const KAKAO_REDIRECT_URI_LOCAL = defineSecret("KAKAO_REDIRECT_URI_LOCAL");
const FRONTEND_REDIRECT_URI_LOCAL = defineSecret("FRONTEND_REDIRECT_URI_LOCAL");

admin.initializeApp(
    {credential: admin.credential.cert(path.resolve(__dirname, 'serviceAccountKey.json')),}
);

exports.kakaoCallback = onRequest(
  {
    secrets: [
      KAKAO_KEY,
      KAKAO_REDIRECT_URI_PROD,
      KAKAO_REDIRECT_URI_LOCAL,
      FRONTEND_REDIRECT_URI_LOCAL
    ],
    region: "us-central1",
    timeoutSeconds: 180, // ⭐ 함수 타임아웃을 3분(180초)으로 늘림
  },
  async (req, res) => {
    let frontendFinalRedirectUri = "http://localhost:3000/kakao"

    try {
      const kakaoKey = KAKAO_KEY.value();
      console.log(`Debug: KAKAO_KEY value length: ${kakaoKey ? kakaoKey.length : '0'}`);
      
      const redirectUriProd = KAKAO_REDIRECT_URI_PROD.value();
      console.log(`Debug: KAKAO_REDIRECT_URI_PROD: ${redirectUriProd}`);

      const redirectUriLocal = KAKAO_REDIRECT_URI_LOCAL.value();
      console.log(`Debug: KAKAO_REDIRECT_URI_LOCAL: ${redirectUriLocal}`);

      const frontendRedirectUriLocal = FRONTEND_REDIRECT_URI_LOCAL.value();
      console.log(`Debug: FRONTEND_REDIRECT_URI_LOCAL: ${frontendRedirectUriLocal}`);

      const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
      console.log(`Debug: isEmulator: ${isEmulator}`);

      const kakaoRedirectUriForKakaoAPI = isEmulator
        ? redirectUriLocal
        : redirectUriProd;

      const frontendFinalRedirectUri = isEmulator
        ? frontendRedirectUriLocal
        : "https://your-temporary-prod-frontend-url.com/auth/kakao";

      console.log("--- Request Received Debugging Start ---");
      console.log("Request method:", req.method);
      console.log("Request URL:", req.url);
      console.log("Request query params (req.query):", req.query);
      console.log("Request headers:", req.headers);
      console.log("Selected Kakao API Redirect URI (backend):", kakaoRedirectUriForKakaoAPI);
      console.log("Selected Final Frontend Redirect URI:", frontendFinalRedirectUri);
      console.log("--- Request Received Debugging End ---");

      const code = req.query.code;

      if (!code) {
        console.error("Error: No code provided in request. Full query:", req.query);
        return res.status(400).redirect(`${frontendFinalRedirectUri}?error=no_code_param`);
      }

      // ⭐ Kakao access_token 요청 전후 상세 로그 추가 ⭐
      console.log(`[Backend Debug] Attempting to fetch Kakao token from: https://kauth.kakao.com/oauth/token`);
      console.log(`[Backend Debug] client_id: ${kakaoKey ? 'Set' : 'Undefined'} (length: ${kakaoKey ? kakaoKey.length : 0})`);
      console.log(`[Backend Debug] redirect_uri: ${kakaoRedirectUriForKakaoAPI}`);
      console.log(`[Backend Debug] code: ${code ? 'Set' : 'Undefined'} (length: ${code ? code.length : 0})`);
      
      const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: kakaoKey,
          redirect_uri: kakaoRedirectUriForKakaoAPI,
          code,
        }),
      });

      console.log(`[Backend Debug] Received response from Kakao token API. Status: ${tokenRes.status}`);

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        console.error(`[Backend Error] Kakao token request failed with status ${tokenRes.status}:`, errorText);
        throw new Error(`Kakao API Error: ${tokenRes.status} - ${errorText}`);
      }

      const tokenJson = await tokenRes.json();
      console.log(`[Backend Debug] Successfully parsed Kakao token response:`, tokenJson);

      const access_token = tokenJson.access_token;

      if (!access_token) {
        console.error("Failed to get Kakao access token:", tokenJson);
        throw new Error("Access token missing");
      }

      // ⭐ Kakao 사용자 정보 요청 전후 상세 로그 추가 ⭐
      console.log(`[Backend Debug] Attempting to fetch Kakao user info from: https://kapi.kakao.com/v2/user/me`);
      console.log(`[Backend Debug] Using access_token length: ${access_token ? access_token.length : 0}`);

      const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      console.log(`[Backend Debug] Received response from Kakao user info API. Status: ${userRes.status}`);

      const user = await userRes.json();
      console.log(`[Backend Debug] Successfully parsed Kakao user info response:`, user);
      
      const uid = `kakao:${user.id}`;

      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "kakao",
        name: user.kakao_account.profile?.nickname,
      });

      console.log("Custom token created successfully. Redirecting to:", `${frontendFinalRedirectUri}?token=${customToken}`);
      return res.redirect(`${frontendFinalRedirectUri}?token=${customToken}`);

    } catch (e) {
      console.error("!!! Unhandled error in kakaoCallback catch block !!!", e);
      // 에러 발생 시 프론트엔드로 에러 파라미터와 함께 리디렉션
      return res.status(500).redirect(`${frontendFinalRedirectUri}?error=auth_failed_unhandled&details=${e.message}`);
    }
  }
);
