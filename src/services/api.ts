import { signOut } from "@/contexts/AuthContext";
import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { AuthTokenError } from "./errors/AuthTokenError";

interface AxiosErrorResponse {
  code?: string;
}

/* INICIO - só executa uma vez quando usuario abre a tela*/
let isRefreshing = false;
let failedRequestsQueue = [];

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["nextauth.token"]}`,
    },
  });
  /* FIM - só executa uma vez quando usuario abre a tela*/

  /* executa varias vezes*/
  // *fn refresh token
  // *vamos pausar todas as requisicoes ate o token atualizar, edepois executar essas chamadas.
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError<AxiosErrorResponse>) => {
      if (error.response?.status === 401) {
        if (error?.response?.data?.code === "token.expired") {
          // *renovar token
          cookies = parseCookies(ctx);

          const { "nextauth.refreshToken": refreshToken } = cookies;
          const originalConfig = error.config;

          // *so vai ser feita a chamada de refresh token uma unica vez
          if (!isRefreshing) {
            isRefreshing = true;

            api
              .post("/refresh", {
                refreshToken,
              })
              .then((response) => {
                const token = response?.data?.token;
                setCookie(ctx, "nextauth.token", token, {
                  maxAge: 60 * 60 * 24 * 30, // *30 dias
                  path: "/", //* qualquer endereco da aplicacao vai ter acesso ao cookie
                });
                setCookie(
                  ctx,
                  "nextauth.refreshToken",
                  response?.data?.refreshToken,
                  {
                    maxAge: 60 * 60 * 24 * 30, // *30 dias
                    path: "/", //* qualquer endereco da aplicacao vai ter acesso ao cookie
                  }
                );

                api.defaults.headers["Authorization"] = `Bearer ${token}`;

                failedRequestsQueue.forEach((request) =>
                  request.onSuccess(token)
                );
                failedRequestsQueue = [];
              })
              .catch((err) => {
                failedRequestsQueue.forEach((request) =>
                  request.onFailure(err)
                );
                failedRequestsQueue = [];

                if (typeof window !== "undefined") {
                  signOut();
                }
              })
              .finally(() => {
                isRefreshing = false;
              });
          }

          return new Promise((resolve, reject) => {
            failedRequestsQueue.push({
              onSuccess: (token: string) => {
                if (originalConfig) {
                  originalConfig.headers["Authorization"] = `Bearer ${token}`;
                  resolve(api(originalConfig));
                }
              },
              onFailure: (err: AxiosError) => {
                reject(err);
              },
            });
          });
        } else {
          // *deslogar o usuario
          if (typeof window !== "undefined") {
            signOut();
          } else {
            return Promise.reject();
          }
        }
      }

      return Promise.reject(new AuthTokenError());
    }
  );

  return api;
}
