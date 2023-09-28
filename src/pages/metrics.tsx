import { setupAPIClient } from "@/services/api";
import { withSSRAuth } from "@/utils/withSSRAuth";
import React, { useContext, useEffect } from "react";

export default function Metrics() {
  return (
    <>
      <h1>Metrics</h1>
    </>
  );
}

export const getServerSideProps = withSSRAuth(
  async (ctx) => {
    const apiClient = setupAPIClient(ctx);
    const response = await apiClient.get("/me");
    console.log(
      "🚀 ~ file: dashboard.tsx:25 ~ getServerSideProps ~ response:",
      response
    );

    return {
      props: {},
    };
  },
  {
    permissions: ["metrics.list"],
    roles: ["administrator"],
  }
);
