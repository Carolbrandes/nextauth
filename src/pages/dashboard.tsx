import { AuthContext } from "@/contexts/AuthContext";
import { setupAPIClient } from "@/services/api";
import { api } from "@/services/apiClient";
import { withSSRAuth } from "@/utils/withSSRAuth";
import React, { useContext, useEffect } from "react";

export default function dashboard() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api
      .get("/me")
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
  }, []);

  return <div>dashboard: {user?.email}</div>;
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);
  const response = await apiClient.get("/me");
  console.log(
    "🚀 ~ file: dashboard.tsx:23 ~ getServerSideProps ~ response:",
    response.data
  );
  return {
    props: {},
  };
});
