  import { NextAuthOptions } from "next-auth";
  import CredentialsProvider from "next-auth/providers/credentials";

  export const authOptions: NextAuthOptions = {
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/login",
    },
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password required");
          }

          try {
            // Call backend login API
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
              throw new Error(data.error || "Invalid credentials");
            }

            // Return user data + token
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              accessToken: data.token, // JWT from backend
            };
          } catch (error: any) {
            throw new Error(error.message || "Authentication failed");
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        // Initial sign in
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.accessToken = user.accessToken;
        }
        return token;
      },
      async session({ session, token }) {
        // Add custom fields to session
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.accessToken = token.accessToken as string;
        }
        return session;
      },
    },
  };