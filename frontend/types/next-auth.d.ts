import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      name: string;
      email: string;
      role: string;
    };
  }

  interface User {
    role: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    role: string;
  }
}
