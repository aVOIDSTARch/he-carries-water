import GitHub from "@auth/core/providers/github";
import { defineConfig } from "auth-astro";
import { logUserLogin } from "./src/lib/audit-logger";

export default defineConfig({
  providers: [
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // After successful sign in, redirect to admin dashboard
      // If url is already an absolute URL, use it
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If it's a relative URL starting with baseUrl, use it
      else if (new URL(url).origin === baseUrl) return url;
      // Otherwise redirect to admin dashboard
      return `${baseUrl}/admin`;
    },
    async signIn({ user, account, profile }) {
      // Only allow specific GitHub username
      const allowedUsername = import.meta.env.ADMIN_GITHUB_USERNAME;

      console.log('Sign in attempt:', {
        profileLogin: profile?.login,
        allowedUsername: allowedUsername,
        match: profile?.login === allowedUsername
      });

      if (profile?.login === allowedUsername) {
        console.log('✅ Access granted to:', profile.login);

        // Log successful login
        await logUserLogin({
          id: user?.id as string | undefined,
          name: (user?.name || profile?.name || profile?.login) as string | undefined,
          email: (user?.email || profile?.email) ?? undefined,
        });

        return true;
      }

      console.log('❌ Access denied to:', profile?.login);
      // Deny access to anyone else
      return false;
    },
    async session({ session, token }) {
      // Add GitHub username to session
      if (token?.login) {
        session.user.username = token.login;
      }
      return session;
    },
    async jwt({ token, profile }) {
      // Add GitHub username to token
      if (profile?.login) {
        token.login = profile.login;
      }
      return token;
    },
  },
});
