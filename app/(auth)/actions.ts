"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { Provider } from "@supabase/supabase-js";
import { getURL } from "@/lib/utils";
import { redirect } from "next/navigation";
import { getUser } from "@/db/cached-queries";
import { registerFormData, loginFormData } from "@/utils/form-schema";
import { revalidatePath } from "next/cache";

export interface LoginActionState {
    status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export interface RegisterActionState {
    status:
      | 'idle'
      | 'in_progress'
      | 'success'
      | 'failed'
      | 'user_exists'
      | 'invalid_data';
  }

export async function login(_: LoginActionState, formData: loginFormData): Promise<LoginActionState> {
    try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
    });

    if (error) {
        return { status: "failed" };
    }

    return { status: "success"};
    revalidatePath('/', 'layout')
    
    } catch(error) {
        if (error instanceof z.ZodError) {
            return { status: "invalid_data"};
        }
    }
    return { status: 'failed' };
}

export async function signInWithOAuth(provider: Provider) {
    try {
        const supabase = await createClient();
        const redirectUrl = `${getURL()}/auth/callback`;
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
                redirectTo: redirectUrl
            }
        });
    
        if (error) {
            return { error: error.message };
        }
    
        if (data.url) {
            return data.url;
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { status: 'invalid_data'}
        }
    }
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get("email") as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}/update-password`,
    });

    if (error) {
        return { error: error.message };
    }
}

export async function signOut() {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        return { error: error.message };
    }

    redirect("/login");
}

export async function register(_:RegisterActionState, formData: registerFormData) {
    try {
        const supabase = await createClient();
        const data = {
            email: formData.email,
            password: formData.password,
          };
        // Check if user exists
        const existingUser = await getUser(data.email);
        if (existingUser) {
          return { status: 'user_exists' };
        }
    
        // Sign up new user
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          },
        });
    
        if (error) {
          return { status: 'failed' };
        }
    
        return { status: 'success' };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { status: 'invalid_data' };
        }
    
        return { status: 'failed' };
      }
}