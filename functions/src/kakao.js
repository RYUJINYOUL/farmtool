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
      const frontendFinalRedirectUri = "https://www.cstalk.kr/kakao";

      // POST 요청인지 확인 (앱에서 보낸 요청)
      if (req.method === 'POST') {
        const accessToken = req.body.access_token;
        const state = req.body.state; // 앱에서 보낸 'app' 값을 확인

        if (!accessToken) {
          return res.status(400).json({ error: 'Access token missing' });
        }

        const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const user = await userRes.json();
        
        const uid = `kakao${user.id}`;
        const nickname = user.kakao_account?.profile?.nickname;
        const email = user.kakao_account?.email;
        const photoURL = user.kakao_account?.profile?.profile_image_url;

        let firebaseUid = uid;
        const existingUserByEmail = email ? await admin.auth().getUserByEmail(email).catch(() => null) : null;

        if (existingUserByEmail) {
          firebaseUid = existingUserByEmail.uid;
          await admin.auth().updateUser(firebaseUid, {
            displayName: nickname,
            photoURL: photoURL,
          });
        } else {
          try {
            await admin.auth().updateUser(firebaseUid, {
              displayName: nickname,
              email: email,
              photoURL: photoURL,
            });
          } catch (error) {
            if (error.code === 'auth/user-not-found') {
              await admin.auth().createUser({
                uid: firebaseUid,
                displayName: nickname,
                email: email,
                photoURL: photoURL,
              });
            } else {
              throw error;
            }
          }
        }

        const customToken = await admin.auth().createCustomToken(firebaseUid);
        
        // 앱의 요청인 경우, JSON으로 Custom Token을 반환
        return res.status(200).json({ customToken: customToken });

      // GET 요청인 경우 (웹 리다이렉트)
      } else if (req.method === 'GET') {
        const kakaoRedirectUriForKakaoAPI = redirectUriProd;
        const code = req.query.code;

        if (!code) {
          console.error("Error: No code provided in request. Full query:", req.query);
          return res.status(400).redirect(`${frontendFinalRedirectUri}?error=no_code_param`);
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
        // ... (사용자 정보 처리 로직)
        const customToken = await admin.auth().createCustomToken(uid);
        
        // 웹의 요청인 경우, URL 리다이렉트로 Custom Token을 반환
        return res.redirect(`${frontendFinalRedirectUri}?token=${customToken}`);
      }

    } catch (e) {
      console.error('카카오 로그인 처리 중 오류:', e);
      return res.status(500).json({ error: 'auth_failed_unhandled', details: e.message });
    }
  }
);
