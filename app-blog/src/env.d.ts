/// <reference types="astro/client" />
/// <reference types="@auth/core/types" />

import { DefaultSession } from "@auth/core/types"

declare module "@auth/core/types" {
    interface Session {
        user: {
            username?: string
        } & DefaultSession["user"]
    }

    interface User {
        login?: string
        username?: string
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        login?: string
    }
}
