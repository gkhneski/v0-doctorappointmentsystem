/** Yol, verilen tabanın kendisi ya da altı mı? ("/patient" tabanı "/patient-form"u kapsamaz.) */
export function isUnderPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + "/")
}
