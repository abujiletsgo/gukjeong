import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

// NextAuth v5 설정 (카카오/네이버 OAuth)
// TODO: 프로덕션 배포 시 실제 OAuth 클라이언트 ID/Secret 설정
export const authConfig: NextAuthConfig = {
  providers: [
    // 카카오 OAuth — developers.kakao.com 에서 앱 등록 필요
    // Kakao({
    //   clientId: process.env.KAKAO_CLIENT_ID!,
    //   clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    // }),
    // 네이버 OAuth — developers.naver.com 에서 앱 등록 필요
    // Naver({
    //   clientId: process.env.NAVER_CLIENT_ID!,
    //   clientSecret: process.env.NAVER_CLIENT_SECRET!,
    // }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
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

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
