const functions = require('firebase-functions');
const axios = require('axios');

exports.fetchBlogInfo = functions.https.onCall(async (data, context) => {
    // 변수 선언을 try 블록 밖으로 이동
    let blogUrl, title, description, foundImages = [];
    
    try {
        // 안전한 로깅을 위한 데이터 처리
        const safeData = {
            hasData: !!data,
            dataType: typeof data,
            hasDataData: !!(data && data.data),
            blogUrl: data?.data?.blogUrl || data?.blogUrl
        };
        console.log('Function called with data:', safeData);
        
        // 데이터 객체 검증
        if (!data) {
            console.error('No data object received');
            throw new functions.https.HttpsError('invalid-argument', 'No data provided');
        }

        // data.data가 있는지 확인 (Cloud Functions의 특성)
        const inputData = data.data || data;

        // blogUrl 속성 검증
        if (!inputData.blogUrl) {
            console.error('No blogUrl in data:', inputData);
            throw new functions.https.HttpsError('invalid-argument', 'URL이 제공되지 않았습니다.');
        }

        blogUrl = inputData.blogUrl.toString().trim();
        console.log('Final URL to process:', blogUrl);
        console.log('처리할 URL:', blogUrl);
        console.log('Processing URL:', blogUrl);
        console.log('Processing URL:', blogUrl);

        // URL 파싱 및 변환
        let mobileUrl;
        try {
            // URL 파싱
            let targetUrl;
            try {
                const url = new URL(blogUrl);
                
                // 네이버 블로그인 경우
                if (url.hostname.includes('blog.naver.com')) {
                    if (url.pathname.match(/\/[^\/]+\/\d+$/)) {
                        // 짧은 URL 형식 (blog.naver.com/userId/postId)
                        const [, userId, postId] = url.pathname.split('/');
                        targetUrl = `https://m.blog.naver.com/${userId}/${postId}`;
                    } else if (url.pathname.includes('PostView.naver')) {
                        // 긴 URL 형식
                        const blogId = url.searchParams.get('blogId');
                        const logNo = url.searchParams.get('logNo');
                        if (!blogId || !logNo) {
                            throw new Error('블로그 ID 또는 글 번호가 없습니다.');
                        }
                        targetUrl = `https://m.blog.naver.com/${blogId}/${logNo}`;
                    } else {
                        throw new Error('지원되지 않는 네이버 블로그 URL 형식입니다.');
                    }
                    console.log('Converted to mobile URL:', targetUrl);
                } else {
                    // 일반 웹사이트
                    targetUrl = blogUrl;
                    console.log('Processing website URL:', targetUrl);
                }
            } catch (e) {
                throw new Error('URL 파싱 실패: ' + e.message);
            }
            mobileUrl = targetUrl;
        } catch (urlError) {
            console.error('URL 파싱 에러:', urlError);
            throw new functions.https.HttpsError('invalid-argument', 'URL 파싱 실패: ' + urlError.message);
        }

        console.log('Fetching URL:', mobileUrl);

      const response = await axios({
        method: 'get',
        url: mobileUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000,
        maxRedirects: 5,
        responseType: 'text',
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });

      if (!response.data) {
        throw new functions.https.HttpsError('internal', '블로그 응답이 비어있습니다.');
      }

      const html = response.data;
      
      // HTML에서 정보 추출
      let title, description, image;
      
      try {
          // 제목 추출 시도
          const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
          if (!titleMatch) {
              const titleMatch2 = html.match(/<title>([^<]+)<\/title>/);
              title = titleMatch2 ? titleMatch2[1].trim() : null;
          } else {
              title = titleMatch[1].trim();
          }

          // 설명 추출 시도 (전체 본문)
          const contentPatterns = [
              /<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,  // SE 에디터
              /<div[^>]*class="[^"]*se-component[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,       // SE 컴포넌트
              /<div[^>]*class="[^"]*post-view[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,         // 구 에디터
              /<div[^>]*class="[^"]*post_content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,      // 더 옛날 에디터
              /<div[^>]*id="postViewArea[^"]*"[^>]*>([\s\S]*?)<\/div>/gi               // 가장 옛날 에디터
          ];

          let contentHtml = '';
          for (const pattern of contentPatterns) {
              const matches = html.matchAll(pattern);
              for (const match of matches) {
                  if (match[1]) {
                      contentHtml += match[1] + '\n';
                  }
              }
          }

          if (contentHtml) {
              // HTML 태그 처리
              description = contentHtml
                  // 줄바꿈 태그를 실제 줄바꿈으로
                  .replace(/<br\s*\/?>/gi, '\n')
                  .replace(/<p[^>]*>/gi, '')
                  .replace(/<\/p>/gi, '\n')
                  .replace(/<div[^>]*>/gi, '')
                  .replace(/<\/div>/gi, '\n')
                  // 이미지 설명 보존
                  .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, '$1')
                  // 나머지 HTML 태그 제거
                  .replace(/<[^>]+>/g, '')
                  // HTML 엔티티 디코딩
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&')
                  .replace(/&quot;/g, '"')
                  // 연속된 줄바꿈과 공백 정리
                  .replace(/\n\s*\n/g, '\n\n')
                  .replace(/[ \t]+/g, ' ')
                  .trim();
          }

          // 본문을 찾지 못한 경우 메타 설명 사용
          if (!description) {
              try {
                  const metaPattern = /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/gi;
                  const matches = Array.from(html.matchAll(metaPattern));
                  if (matches.length > 0) {
                      description = matches[0][1].trim();
                  }
              } catch (metaError) {
                  console.error('Meta description extraction error:', metaError);
              }
          }

          // 여전히 설명이 없으면 기본값 설정
          if (!description) {
              description = '내용을 가져올 수 없습니다.';
          }

          console.log('Extracted content length:', description?.length || 0);

          // 모든 이미지 URL 추출
          // 이미지 URL 수집
          const imageUrls = new Set();
          const patterns = [
              /<meta property="og:image" content="([^"]+)"/g,
              /<img[^>]+class="se-image-resource"[^>]+src="([^"]+)"/g,
              /<img[^>]+src="([^"]+)"[^>]+class="se-image-resource"/g,
              /<div[^>]+class="se-module-image"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/g
          ];

          // 각 패턴으로 이미지 URL 찾기
          for (const pattern of patterns) {
              let match;
              while ((match = pattern.exec(html)) !== null) {
                  if (match[1]) {
                      let imageUrl = match[1].trim();
                      if (!imageUrl.startsWith('http')) {
                          imageUrl = 'https:' + imageUrl;
                      }
                      imageUrls.add(imageUrl);
                  }
              }
          }

          // Set을 배열로 변환
          foundImages = Array.from(imageUrls);
          console.log('Found image URLs:', foundImages);

          // 이미지를 찾지 못한 경우 로그
          if (foundImages.length === 0) {
              console.log('No images found in HTML');
          }
      } catch (parseError) {
          console.error('HTML 파싱 에러:', parseError);
          throw new functions.https.HttpsError('internal', 'HTML 파싱 중 오류가 발생했습니다: ' + parseError.message);
      }
      
      console.log('Extracted info:', { title, description, image });
      
      if (!title && !description) {
        throw new functions.https.HttpsError('not-found', '블로그 정보를 찾을 수 없습니다.');
      }

      // 모든 이미지 다운로드 시도
      const imageBase64List = [];
      for (const imageUrl of foundImages) {
        try {
          console.log('Downloading image from:', imageUrl);
          const imageResponse = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Referer': 'https://blog.naver.com/'
            },
            timeout: 5000
          });
          
          const contentType = imageResponse.headers['content-type'];
          const base64 = Buffer.from(imageResponse.data, 'binary').toString('base64');
          imageBase64List.push(`data:${contentType};base64,${base64}`);
          console.log('Image converted to base64');
        } catch (imageError) {
          console.error('Error downloading image:', imageError);
          // 이미지 다운로드 실패는 치명적이지 않으므로 계속 진행
        }
      }

      return {
        title: title || '',
        content: description || '',
        imageUrls: foundImages,
        imageBase64List: imageBase64List
      };
    } catch (error) {
      console.error('Blog fetch error:', error);
      
      // axios 에러 상세 정보 로깅
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        });
      }

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // 타임아웃 에러
      if (error.code === 'ECONNABORTED') {
        throw new functions.https.HttpsError('deadline-exceeded', '블로그 서버 응답 시간이 초과되었습니다.');
      }

      // 네트워크 에러
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new functions.https.HttpsError('unavailable', '블로그 서버에 연결할 수 없습니다.');
      }

      // axios 응답 에러
      if (error.response) {
        if (error.response.status === 404) {
          throw new functions.https.HttpsError('not-found', '블로그 글을 찾을 수 없습니다.');
        }
        if (error.response.status === 403) {
          throw new functions.https.HttpsError('permission-denied', '블로그 접근이 거부되었습니다.');
        }
      }

      // 기타 에러
      throw new functions.https.HttpsError('internal', `블로그 정보를 가져오는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    }
});
