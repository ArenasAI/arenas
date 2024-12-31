import AuthCodeErrorPage from "@/components/auth-error";
import { Suspense } from "react";

const AuthCodeError = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCodeErrorPage />
        </Suspense>
    )
}

export default AuthCodeError;