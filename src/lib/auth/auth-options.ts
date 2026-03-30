import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db/connection";
import { User } from "@/lib/db/models";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }

        await connectDB();

        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        }).select("+password");

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.isVerified) {
          throw new Error("Please verify your email first");
        }

        if (user.provider === "google") {
          throw new Error(
            'This account uses Google sign-in. Please use "Continue with Google".',
          );
        }

        const isValid = await user.comparePassword(credentials.password);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();

        // Check if user exists
        let dbUser = await User.findOne({ email: user.email?.toLowerCase() });

        if (!dbUser) {
          // Create new user for Google sign-in
          dbUser = await User.create({
            email: user.email?.toLowerCase(),
            name: user.name,
            avatar: user.image,
            isVerified: true, // Google accounts are pre-verified
            provider: "google",
            providerId: account.providerAccountId,
          });
        } else if (dbUser.provider === "credentials") {
          // Link Google account to existing credentials account
          dbUser.provider = "google";
          dbUser.providerId = account.providerAccountId;
          if (!dbUser.avatar && user.image) {
            dbUser.avatar = user.image;
          }
          await dbUser.save();
        }

        // Add MongoDB id to user object
        user.id = dbUser._id.toString();
        (user as any).role = dbUser.role;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }

      // Handle session update
      if (trigger === "update" && session) {
        token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
