export function envValidation(config: Record<string, unknown>) {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
  return config;
}
