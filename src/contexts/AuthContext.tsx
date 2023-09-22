import { api } from "@/services/api";
import Router from "next/router";
import { ReactNode, createContext, useState } from "react";
import { setCookie } from "nookies";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  isAuthenticated: boolean;
  user: User;
};

type AuthProvider = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProvider) {
  const [user, setUser] = useState<User>({} as User);
  const isAuthenticated = !!user;

  // *essa funcao signIn so pode ocorrer no lado do browser, pq precisa de interacao com usuario
  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post("sessions", {
        email,
        password,
      });

      const { token, refreshToken, permissions, roles } = response.data;

      // * nao foi criado um cookie para email, avatar, nome e outras informacoes do usuario, pq com o token, quando usuario acessar a aplicacao ele vai e puxa essas informacoes.
      setCookie(undefined, "nextauth.token", token, {
        maxAge: 60 * 60 * 24 * 30, // *30 dias
        path: "/", //* qualquer endereco da aplicacao vai ter acesso ao cookie
      });
      setCookie(undefined, "nextauth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // *30 dias
        path: "/", //* qualquer endereco da aplicacao vai ter acesso ao cookie
      });

      setUser({
        email,
        permissions,
        roles,
      });

      Router.push("/dashboard");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}
