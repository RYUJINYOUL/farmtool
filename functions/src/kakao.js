const admin = require("./firebaseAdmin");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");


const KAKAO_KEY = defineSecret("KAKAO_KEY");
const KAKAO_REDIRECT_URI_PROD = defineSecret("KAKAO_REDIRECT_URI_PROD");


exports.kakaoCallback = onRequest(
  {
    secrets: [
      KAKAO_KEY,
      KAKAO_REDIRECT_URI_PROD
    ],
    region: "us-central1",
    timeoutSeconds: 180,
  },
  async (req, res) => {
    try {
      const kakaoKey = KAKAO_KEY.value();
      const redirectUriProd = KAKAO_REDIRECT_URI_PROD.value();

      const frontendFinalRedirectUri = "https://farmtool.vercel.app/kakao";
      const kakaoRedirectUriForKakaoAPI = redirectUriProd;


      const code = req.query.code;

      if (!code) {
        console.error("Error: No code provided in request. Full query:", req.query);        return res.status(400).redirect(`${frontendFinalRedirectUri}?error=no_code_param`);
      }

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


      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Kakao API Error: ${tokenRes.status} - ${errorText}`);
      }

      const tokenJson = await tokenRes.json();

      const access_token = tokenJson.access_token;

      if (!access_token) {
        throw new Error("Access token missing");
      }


      const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const user = await userRes.json();
      
      const uid = `kakao${user.id}`;

      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "kakao",
        name: user.kakao_account.profile?.nickname,
      });

      return res.redirect(`${frontendFinalRedirectUri}?token=${customToken}`);

    } catch (e) {
      const frontendFinalRedirectUri = "https://farmtool.vercel.app/kakao";
      return res.status(500).redirect(`${frontendFinalRedirectUri}?error=auth_failed_unhandled&details=${e.message}`);
    }
  }
);