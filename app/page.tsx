import { requireChatGPTUser } from './chatgpt-auth';
import { ClinicApp } from './clinic-app';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await requireChatGPTUser('/');
  return <ClinicApp professionalName={user.fullName ?? 'Valentina Rocha'} />;
}
