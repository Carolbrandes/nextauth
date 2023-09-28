import { AuthContext } from "@/contexts/AuthContext";
import { useCan } from "@/hooks/useCan";
import { setupAPIClient } from "@/services/api";
import { api } from "@/services/apiClient";
import { withSSRAuth } from "@/utils/withSSRAuth";
import React, { useContext, useEffect } from "react";

export default function dashboard() {
  const { user, isAuthenticated } = useContext(AuthContext);

  const userCanSeeMetrics = useCan({
    permissions: ["metrics.list"],
  });

  useEffect(() => {
    api
      .get("/me")
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h1>dashboard: {user?.email}</h1>
      {userCanSeeMetrics && <div>Métricas</div>}
    </div>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);
  const response = await apiClient.get("/me");
  console.log(
    "🚀 ~ file: dashboard.tsx:25 ~ getServerSideProps ~ response:",
    response
  );

  return {
    props: {},
  };
});
