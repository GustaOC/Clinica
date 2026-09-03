// Fail closed: removing the previous identity provider must never expose records.
// A new authenticated, authorized backend is required before re-enabling this API.
function unavailable() {
  return Response.json(
    {
      error: 'PATIENT_PORTAL_UNAVAILABLE',
      message:
        'Área clínica indisponível. Autenticação e banco de dados precisam ser configurados.',
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
export const GET = unavailable;
export const POST = unavailable;
