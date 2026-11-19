import { metric, upgradeWebSocket } from "@vercel/functions";
import { NextResponse } from "next/server";
import type { WebSocket } from "ws";

import { isLocalGatewayUrl } from "@/lib/gateway/local-gateway";
import { loadStudioSettings } from "@/lib/studio/settings-store";
import { createAccessGate } from "../../../../../server/access-gate";
import { attachDemoClient } from "../../../../../server/demo-gateway-adapter";
import { createGatewayProxy } from "../../../../../server/gateway-proxy";

export const dynamic = "force-dynamic";

const MAX_WS_PAYLOAD_BYTES = 256 * 1024;

type GatewayProxyInstance = {
  handleConnection: (ws: WebSocket) => void;
};

const loadCurrentGatewayTarget = () => {
  const settings = loadStudioSettings();
  const gateway = settings.gateway;
  return {
    url: gateway?.url?.trim() ?? "",
    token: gateway?.token?.trim() ?? "",
    adapterType: gateway?.adapterType?.trim() || "openclaw",
  };
};

let sharedProxy: GatewayProxyInstance | null = null;

const getGatewayProxy = (): GatewayProxyInstance => {
  if (!sharedProxy) {
    sharedProxy = createGatewayProxy({
      loadUpstreamSettings: async () => loadCurrentGatewayTarget(),
      log: (message: string) => console.info(message),
      logError: (message: string, error: unknown) => console.error(message, error),
    }) as GatewayProxyInstance;
  }
  return sharedProxy;
};

export async function GET(request: Request) {
  const accessGate = createAccessGate({
    token: process.env.STUDIO_ACCESS_TOKEN,
  }) as {
    allowUpgrade: (req: { headers?: Record<string, string | undefined> }) => boolean;
  };

  const authorized = accessGate.allowUpgrade({
    headers: {
      cookie: request.headers.get("cookie") ?? undefined,
      "x-forwarded-for": request.headers.get("x-forwarded-for") ?? undefined,
    },
  });

  if (!authorized) {
    metric("gateway.ws.connections", 1, { adapter: "unknown", outcome: "unauthorized" });
    return NextResponse.json(
      {
        error: "Studio access token required. Send the configured Studio access cookie and retry.",
      },
      { status: 401 }
    );
  }

  const target = loadCurrentGatewayTarget();
  const adapterTag = target.adapterType || "openclaw";

  try {
    return await upgradeWebSocket(
      (ws) => {
        const startedAt = performance.now();
        metric("gateway.ws.connections", 1, { adapter: adapterTag, outcome: "upgraded" });
        ws.once("close", () => {
          metric("gateway.ws.session_duration_ms", performance.now() - startedAt, {
            adapter: adapterTag,
          });
        });

        if (target.adapterType === "demo" && (!target.url || isLocalGatewayUrl(target.url))) {
          (attachDemoClient as (client: WebSocket) => void)(ws);
          return;
        }

        getGatewayProxy().handleConnection(ws);
      },
      { maxPayload: MAX_WS_PAYLOAD_BYTES }
    );
  } catch (error) {
    metric("gateway.ws.connections", 1, { adapter: adapterTag, outcome: "error" });
    const message =
      error instanceof Error ? error.message : "WebSocket upgrade failed.";
    console.error("[gateway/ws] WebSocket upgrade failed:", error);
    return NextResponse.json({ error: message }, { status: 426 });
  }
}
