import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Enter a username"),
  password: z.string().min(1, "Enter a password"),
});

export const SignupSchema = z.object({
  username: z.string().min(4, "Username should contain at least 4 characters"),
  password: z.string().min(8, "Password should contain at least 8 characters"),
  password2: z
    .string()
    .min(8, "Password2 should contain at least 8 characters"),
});

export const ChatSchema = z.object({
  chatMessage: z
    .string()
    .min(1, "Enter a message")
    .max(10000, "Your message is too long"),
});

// Automatischer Type für TypeScript
export type LoginData = z.infer<typeof LoginSchema>;
