import { AuthContext } from "@/contexts/AuthContext";
import { api } from "@/services/api";
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
