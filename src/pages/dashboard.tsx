import { AuthContext } from "@/contexts/AuthContext";
import React, { useContext } from "react";

export default function dashboard() {
  const { user } = useContext(AuthContext);
  return <div>dashboard: {user?.email}</div>;
}
