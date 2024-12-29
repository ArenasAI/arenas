'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

import { SignInWithPasswordCredentials, User, Session, Provider } from "@supabase/auth-js"


//check login using email

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data: SignInWithPasswordCredentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: res, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout')
  redirect('/you')
}

//login using Oauth
export async function signInWithOAuth(provider: Provider) {
  const supabase = createClient();

  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: provider,
  });

  if (error) {
    redirect("/login?message=Could not authenticate user.");
  }

  revalidatePath("/", "layout");

}



//register using email

export async function register(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
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