import { api } from "@/services/apiClient";
import Router from "next/router";
import { ReactNode, createContext, useEffect, useState } from "react";
import { setCookie, parseCookies, destroyCookie } from "nookies";

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
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel; // *colocou esse let pq aqui esta sendo executado no parte do servidor e isso deve ocorrer no lado do cliente. entao sera executado no useeffect

export function signOut() {
  destroyCookie(undefined, "nextauth.token");
  destroyCookie(undefined, "nextauth.refreshToken");

  authChannel.postMessage("signOut");
  Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>({} as User);
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");
    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "signOut":
          signOut();
          break;

        default:
          break;
      }
    };
  }, []);

  //* como estamos lidando com informacoes do usuario como permissoes, tipo de acesso e essas informacoes sao mais propensas a serem alteradas, vamos chamar a api para buscar os dados do usuario td vez q ele acessar a app. Se nao fosse esse contexto, se sao dados que sao mais dificies de terem alteracao, poderia apenas utilizar o token.
  useEffect(() => {
    const { "nextauth.token": token } = parseCookies();

    if (token) {
      api
        .get("/me")
        .then((response) => {
          const { email, permissions, roles } = response.data;
          setUser({ email, permissions, roles });
        })
        .catch(() => {
          signOut();
        });
    }
  }, []);

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

      api.defaults.headers["Authorization"] = `Bearer ${token}`;

      Router.push("/dashboard");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
