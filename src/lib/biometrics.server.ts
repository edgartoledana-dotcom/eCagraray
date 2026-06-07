const PII_FIELDS = [
  "contact", "contactNo", "phone", "mobile", "telephone",
  "email", "emailAddress",
  "address", "fullAddress",
  "birthdate", "birthDate",
  "fullName", "name",
  "healthHistory", "medicalHistory", "medical",
  "emergencyContact",
];

function maskValue(value: string, field: string): string {
  const lower = field.toLowerCase();

  if (lower.includes("email")) {
    const [local, domain] = value.split("@");
    if (!domain) return value;
    const masked = local.length <= 2
      ? local[0] + "***"
      : local.slice(0, 2) + "***" + local.slice(-1);
    return `${masked}@${domain}`;
  }

  if (lower.includes("phone") || lower.includes("contact") || lower.includes("mobile") || lower.includes("telephone")) {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 10) {
      return digits.slice(0, 4) + "****" + digits.slice(-3);
    }
    return value.slice(0, 3) + "****" + value.slice(-2);
  }

  if (lower.includes("address")) {
    if (value.length > 15) {
      return value.slice(0, 10) + "...";
    }
    return value;
  }

  if (lower.includes("name") && value.includes(" ")) {
    const parts = value.split(" ");
    if (parts.length >= 2) {
      return parts[0] + " " + parts[parts.length - 1][0] + ".";
    }
    return value[0] + "***";
  }

  if (lower.includes("birth")) {
    const parts = value.split("-");
    if (parts.length === 3) {
      return `${parts[0]}-**-**`;
    }
    return "****-**-**";
  }

  if (typeof value === "string" && value.length > 4) {
    return value.slice(0, Math.ceil(value.length / 3)) + "***";
  }

  return value;
}

export function maskPII<T extends Record<string, any>>(record: T, justification?: string): T {
  const masked = { ...record };
  for (const key of Object.keys(masked)) {
    const lower = key.toLowerCase();
    const isPII = PII_FIELDS.some(
      (f) => lower === f || lower.includes(f) || f.includes(lower),
    );
    if (isPII && typeof masked[key] === "string" && masked[key].trim()) {
      masked[key] = maskValue(masked[key], key) as any;
    }
    if (typeof masked[key] === "object" && masked[key] !== null && !Array.isArray(masked[key])) {
      masked[key] = maskPII(masked[key], justification);
    }
  }
  return masked;
}

export function maskPIIArray<T extends Record<string, any>>(records: T[], justification?: string): T[] {
  return records.map((r) => maskPII(r, justification));
}

export function shouldMask(userRole: string): boolean {
  return userRole !== "super_admin";
}
