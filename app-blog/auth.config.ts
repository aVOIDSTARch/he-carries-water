import GitHub from "@auth/core/providers/github";
import { defineConfig } from "auth-astro";

export default defineConfig({
  providers: [
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
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
