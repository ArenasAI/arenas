'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import {
  SignInWithPasswordCredentials,
  Provider,
  User,
  Session,
} from "@supabase/supabase-js"

import { UpdatePasswordFormData } from "@/utils/form-schema"; //set this up

export async function signin (formData: FormData) {
  const supabase = createClient();

  const data : SignInWithPasswordCredentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: res, error } = (await supabase).auth.signInWithPassword(data);
  if (error) {
    return { error: error.message};
  }

  revalidatePath("/", "layout");
}

//how this should work:
//1. Check if user exists, if it does attempt to sign in with email & pasword
//- sign in successful? return isSignedIn = true; (redirect to /dashboard)
//- sign in unsuccessful? return exists: true ({toast 'account exists' on client and redirect to /signin
//2. if user does not exist, sign up with email and password -> redirect to /signin
// - if sign up fails, return error message (toast error on client)


export async function signInWithOAuth(
  provider: Provider
) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider
  });

  if (error) {
    redirect("/signin?message=Could not authenticate user");
  }

  if (data.url) {
    redirect(data.url);
  }

  revalidatePath("/", "layout");
}

// reset passowrd

export async function resetPassword(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getURL()}/update-password`,
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");

}

export async function checkEmailExists(data: {
  user: User | null;
  session: Session | null;
}) {
  return {
    exists:
      data.user && data.user?.identities && data.user?.identities?.length === 0,
  };
}


export async function updateUser(formData: UpdatePasswordFormData) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: formData.password,
  });

  if (error) {
    return {error: error.message};
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}


// resend confrimation email

export async function resendConfirmationEmail(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo: `${getURL()}/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
}