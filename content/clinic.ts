import type { Contact } from '@/lib/contact';

export type ClinicPhoto = {
  src: `/images/${string}`;
  alt: string;
  width: number;
  height: number;
};
export type Specialty = { id: string; name: string; description: string };
export type Professional = {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  rqe?: string;
  photo?: ClinicPhoto;
  curriculum: string[];
};

// Only enter clinic-approved, factual information here. Empty fields are deliberate.
// Real, authorized photographs belong in public/images/, preferably as WebP.
export const clinic = {
  name: 'Lumina',
  descriptor: 'Clínica estética',
  contact: {
    whatsapp: process.env.CLINIC_WHATSAPP ?? '',
    phone: process.env.CLINIC_PHONE ?? '',
    email: process.env.CLINIC_EMAIL ?? '',
    address: process.env.CLINIC_ADDRESS ?? '',
    hours: process.env.CLINIC_HOURS ?? '',
  } satisfies Contact,
  legal: {
    companyName: process.env.CLINIC_COMPANY_NAME ?? '',
    cnpj: process.env.CLINIC_CNPJ ?? '',
    technicalDirector: process.env.CLINIC_TECHNICAL_DIRECTOR ?? '',
    technicalDirectorCrm: process.env.CLINIC_TECHNICAL_DIRECTOR_CRM ?? '',
  },
  heroPhoto: undefined as ClinicPhoto | undefined,
  specialties: [] as Specialty[],
  professionals: [] as Professional[],
  spaces: [
    { title: 'Recepção', photo: undefined as ClinicPhoto | undefined },
    {
      title: 'Ambiente de atendimento',
      photo: undefined as ClinicPhoto | undefined,
    },
    {
      title: 'Tecnologia e equipamentos',
      photo: undefined as ClinicPhoto | undefined,
    },
  ],
  insurancePlans: [] as string[],
};
