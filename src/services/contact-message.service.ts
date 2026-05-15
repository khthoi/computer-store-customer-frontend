import { apiFetch } from "./api";

export interface ContactQuota {
  max: number;
  used: number;
  remaining: number;
}

export interface ContactSubmitInput {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactSubmitResult {
  id: number;
  quota: ContactQuota;
}

export function getContactQuota(): Promise<ContactQuota> {
  return apiFetch<ContactQuota>("/contact-messages/quota");
}

export function submitContactMessage(
  input: ContactSubmitInput,
): Promise<ContactSubmitResult> {
  return apiFetch<ContactSubmitResult>("/contact-messages", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
