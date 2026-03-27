import type { NextAuthOptions } from 'next-auth';

// NextAuth v4 설정 (카카오/네이버 OAuth)
// TODO: 프로덕션 배포 시 실제 OAuth 클라이언트 ID/Secret 설정
export const authOptions: NextAuthOptions = {
  providers: [
    // 카카오 OAuth — developers.kakao.com 에서 앱 등록 필요
    // KakaoProvider({
    //   clientId: process.env.KAKAO_CLIENT_ID!,
    //   clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    // }),
    // 네이버 OAuth — developers.naver.com 에서 앱 등록 필요
    // NaverProvider({
    //   clientId: process.env.NAVER_CLIENT_ID!,
    //   clientSecret: process.env.NAVER_CLIENT_SECRET!,
    // }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
