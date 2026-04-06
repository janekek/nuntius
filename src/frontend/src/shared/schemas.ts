import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Enter a username"),
  password: z.string().min(1, "Enter a password"),
});

export const SignupSchema = z
  .object({
    username: z
      .string()
      .min(4, "Username should contain at least 4 characters")
      .max(20, "Username must be no longer than 20 characters")
      .regex(/^[a-zA-Z0-9]+$/, "Username may only contain letters and numbers"),

    password: z
      .string()
      .min(8, "Password should contain at least 8 characters")
      .max(100, "Password must be no longer than 100 characters")
      .regex(/^[\x21-\x7E]+$/, "Password contains invalid characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      )
      .regex(/^\S+$/, "Password cannot contain any spaces"),

    password2: z
      .string()
      .min(8, "Password should contain at least 8 characters")
      .max(100, "Password must be no longer than 100 characters")
      .regex(/^[\x21-\x7E]+$/, "Password contains invalid characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      )
      .regex(/^\S+$/, "Password cannot contain any spaces"),
  })
  .refine((data) => data.password !== data.password2, {
    message: "Passwords are not allowed to be identical",
    path: ["password2"],
  });

export const ChatSchema = z.object({
  chatMessage: z
    .string()
    .min(1, "Enter a message")
    .max(10000, "Your message is too long"),
});

// Automatischer Type für TypeScript
export type LoginData = z.infer<typeof LoginSchema>;
