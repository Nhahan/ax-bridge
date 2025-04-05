import type { NextConfig } from "next";
import { env } from "@/lib/validateEnv";

const nextConfig: NextConfig = {
  /* config options here */
};

if (process.env.NODE_ENV === 'development') {
  process.env.PORT = env.PORT.toString();
  console.log(`서버가 PORT ${env.PORT}에서 실행됩니다.`);
}

export default nextConfig;
