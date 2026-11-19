import crypto from "node:crypto";
import { env } from "../config/env";
import { BadRequestError } from "../utils/errors";

export interface ZarinpalRequestResult {
  authority: string;
  paymentUrl: string;
  sandboxSimulated?: boolean;
}

export interface ZarinpalVerifyResult {
  verified: boolean;
  refId: string | null;
  code: number;
  raw: unknown;
}

function getZarinpalBase(): { apiBase: string; startPayBase: string } {
  if (env.zarinpalSandbox) {
    return {
      apiBase: "https://sandbox.zarinpal.com/pg/v4/payment",
      startPayBase: "https://sandbox.zarinpal.com/pg/StartPay",
    };
  }
  return {
    apiBase: "https://api.zarinpal.com/pg/v4/payment",
    startPayBase: "https://www.zarinpal.com/pg/StartPay",
  };
}

export async function requestZarinpalPayment(input: {
  amountToman: number;
  description: string;
  orderNumber: string;
  email?: string;
  mobile?: string;
  callbackUrl?: string;
}): Promise<ZarinpalRequestResult> {
  const { apiBase, startPayBase } = getZarinpalBase();
  const amountRial = Math.max(1000, Math.round(input.amountToman * 10));
  const callbackUrl = input.callbackUrl || env.zarinpalCallbackUrl;
  const isPlaceholderMerchant =
    !env.zarinpalMerchantId ||
    /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(env.zarinpalMerchantId);

  if (env.zarinpalSandbox && isPlaceholderMerchant) {
    const sandboxAuthority = `SBOX_${crypto.randomBytes(16).toString("hex")}`;
    return {
      authority: sandboxAuthority,
      paymentUrl: `${callbackUrl}?Authority=${sandboxAuthority}&Status=OK&sandbox=1`,
      sandboxSimulated: true,
    };
  }

  try {
    const response = await fetch(`${apiBase}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: env.zarinpalMerchantId,
        amount: amountRial,
        callback_url: callbackUrl,
        description: input.description,
        metadata: {
          order_id: input.orderNumber,
          ...(input.email ? { email: input.email } : {}),
          ...(input.mobile ? { mobile: input.mobile } : {}),
        },
      }),
    });

    const json = (await response.json()) as {
      data?: { code?: number; authority?: string };
      errors?: unknown;
    };

    if (response.ok && json.data?.code === 100 && json.data.authority) {
      return {
        authority: json.data.authority,
        paymentUrl: `${startPayBase}/${json.data.authority}`,
      };
    }

    if (!env.zarinpalSandbox) {
      throw new BadRequestError(
        "امکان برقراری ارتباط با درگاه پرداخت زرین‌پال وجود ندارد.",
        json.errors
      );
    }
  } catch (err) {
    if (!env.zarinpalSandbox) {
      throw err instanceof BadRequestError
        ? err
        : new BadRequestError("خطا در اتصال به درگاه زرین‌پال.");
    }
  }

  // Sandbox fallback ONLY when ZARINPAL_SANDBOX=true and sandbox gateway is unreachable
  const sandboxAuthority = `SBOX_${crypto.randomBytes(16).toString("hex")}`;
  return {
    authority: sandboxAuthority,
    paymentUrl: `${callbackUrl}?Authority=${sandboxAuthority}&Status=OK&sandbox=1`,
    sandboxSimulated: true,
  };
}

export async function verifyZarinpalPayment(input: {
  authority: string;
  amountToman: number;
}): Promise<ZarinpalVerifyResult> {
  if (!input.authority) {
    return { verified: false, refId: null, code: -1, raw: null };
  }

  // If sandbox authority was generated during offline sandbox fallback
  if (env.zarinpalSandbox && input.authority.startsWith("SBOX_")) {
    const refId = String(10000000 + crypto.randomInt(0, 89999999));
    return {
      verified: true,
      refId,
      code: 100,
      raw: { sandbox: true, code: 100, ref_id: refId },
    };
  }

  const { apiBase } = getZarinpalBase();
  const amountRial = Math.max(1000, Math.round(input.amountToman * 10));

  const response = await fetch(`${apiBase}/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      merchant_id: env.zarinpalMerchantId,
      amount: amountRial,
      authority: input.authority,
    }),
  });

  const json = (await response.json()) as {
    data?: { code?: number; ref_id?: number | string };
    errors?: unknown;
  };

  const code = Number(json.data?.code ?? -1);
  const verified = response.ok && (code === 100 || code === 101);
  return {
    verified,
    refId: json.data?.ref_id ? String(json.data.ref_id) : null,
    code,
    raw: json,
  };
}
