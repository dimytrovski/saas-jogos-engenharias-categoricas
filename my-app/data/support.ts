export const SUPPORT_WHATSAPP = {
  rawPhone: "5596991942615",
  displayPhone: "+55 (96) 99194-2615",
  defaultMessage:
    "Olá! Vim pelo microSaaS para desenvolvedores de jogos e preciso de suporte.",
} as const;

export function getWhatsAppSupportUrl(customMessage?: string): string {
  const message = encodeURIComponent(
    customMessage ?? SUPPORT_WHATSAPP.defaultMessage
  );
  return `https://wa.me/${SUPPORT_WHATSAPP.rawPhone}?text=${message}`;
}