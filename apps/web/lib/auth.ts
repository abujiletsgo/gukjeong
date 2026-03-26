// NextAuth 설정 (카카오/네이버 OAuth)
// TODO: NextAuth 완전 구현

export const authConfig = {
  providers: [
    // 카카오 OAuth
    // {
    //   id: 'kakao',
    //   name: '카카오',
    //   type: 'oauth',
    //   ...
    // },
    // 네이버 OAuth
    // {
    //   id: 'naver',
    //   name: '네이버',
    //   type: 'oauth',
    //   ...
    // },
  ],
  callbacks: {
    // JWT 토큰에서 사용자 정보 추출
    // session: async ({ session, token }) => { ... }
  },
};
