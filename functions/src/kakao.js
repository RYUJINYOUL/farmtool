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
      console.log('카카오 API 응답:', user);
      
      const uid = `kakao${user.id}`;
      const nickname = user.kakao_account?.profile?.nickname;
      const email = user.kakao_account?.email;
      const photoURL = user.kakao_account?.profile?.profile_image_url;

      console.log('Firebase에 전달할 데이터:', { uid, nickname, email, photoURL });

      // 사용자 프로필 업데이트 또는 생성
      let firebaseUid = uid;
      const existingUserByEmail = email ? await admin.auth().getUserByEmail(email).catch(() => null) : null;

      if (existingUserByEmail) {
        firebaseUid = existingUserByEmail.uid;
        await admin.auth().updateUser(firebaseUid, {
          displayName: nickname,
          photoURL: photoURL,
        });
        console.log('✅ 기존 계정에 카카오 정보 업데이트 완료.');
      } else {
        try {
          await admin.auth().updateUser(firebaseUid, {
            displayName: nickname,
            email: email,
            photoURL: photoURL,
          });
          console.log('✅ 기존 사용자 프로필 업데이트 완료');
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            await admin.auth().createUser({
              uid: firebaseUid,
              displayName: nickname,
              email: email,
              photoURL: photoURL,
            });
            console.log('✅ 신규 사용자 생성 완료');
          } else {
            throw error;
          }
        }
      }

      const customToken = await admin.auth().createCustomToken(firebaseUid);
      return res.redirect(`${frontendFinalRedirectUri}?token=${customToken}`);

    } catch (e) {
      console.error('카카오 로그인 처리 중 오류:', e);
      return res.status(500).redirect(`${frontendFinalRedirectUri}?error=auth_failed_unhandled&details=${e.message}`);
    }
  }
);