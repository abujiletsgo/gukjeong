import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// @ts-expect-error — NextAuth v4 handler types don't match Next.js 14 route handler signature exactly
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
