"use server";

import { z } from "zod";
import createClient from "@/lib/supabase/server";
import { Provider, SignInWithPasswordCredentials } from "@supabase/supabase-js";
import { getURL } from "@/lib/utils";
import { redirect } from "next/navigation";
import { registerFormData, loginFormData } from "@/utils/form-schema";
import { revalidatePath } from "next/cache";


export async function login(formData: loginFormData) {
    const supabase = await createClient();

    const data: SignInWithPasswordCredentials = {
        email: formData.email as string,
        password: formData.password as string,
    };
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
        return { error: error.message };
    }
    revalidatePath("/")
}

export async function signInWithOAuth(provider: Provider) {
    try {
        const supabase = await createClient();
        const redirectUrl = `${getURL()}/auth/callback`;
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
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
    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
        return { success: true };
    } catch(err) {
        console.error("sign out failed: ", err);
        return { error: "sign out failed, please try again later!" }
        }
      }

export async function register(formData: registerFormData) {
    try {
        const supabase = await createClient();
        const data = {
            email: formData.email,
            password: formData.password,
        };    

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            redirect("/login");
        }
    
        // Construct the email confirmation redirect using getURL()
        const redirectUrl = `${getURL()}/auth/callback`;
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                emailRedirectTo: redirectUrl,
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