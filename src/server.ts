import os from "os";
import { env } from "@/env";
import { createApp } from "./app";

const app = createApp();

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses: { name: string; address: string }[] = [];

  for (const name in interfaces) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }

  return addresses;
}

app
  .listen({ port: env.PORT, host: "0.0.0.0" }) // 0.0.0.0 coloca o servidor para escutar em todas as interfaces de rede, use com cautela em ambientes de produção
  .then(() => {
    const networkAddresses = getNetworkAddresses();

    console.log(`🚀 Server is running on port ${env.PORT}`);

    console.log("Server is available at the following addresses:");

    networkAddresses.forEach(({ name, address }) => {
      console.log(`- ${name}: http://${address}:${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Server failed to start", error);
  });
