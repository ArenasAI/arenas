import { z } from 'zod';
import { isDisposableEmail } from './disposable-email';

export const emailSchema = z.object({
    email:z
    .string()
    .email({ message: "Email address is invalid! "})
    .refine(async (email) => !(await isDisposableEmail(email)), {
        message:
            "Disposable emails are not allowed! Use a different email."
    }),
})

export const passwordSchema = z.object({
    password: z
    .string()
    .min(6, { message: "Password should be atleast 6 characters long"}),
});

export const registerSchema = z.object({
    email: emailSchema.shape.email,
    password: passwordSchema.shape.password,
})

export const loginSchema = z.object({
    email: emailSchema.shape.email,
    password: passwordSchema.shape.password,
})

export const resetPasswordSchema = z.object({
    email: emailSchema.shape.email,  
})

export const updatePasswordSchema = z.object({
    password: passwordSchema.shape.password,
    confirmPassword: passwordSchema.shape.password,
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords dont match",
    path: ["confirmPassword"],
});


export type registerFormData = z.infer<typeof registerSchema>;
export type loginFormData = z.infer<typeof loginSchema>;
export type resetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type updatePasswordFormData = z.infer<typeof updatePasswordSchema>;
