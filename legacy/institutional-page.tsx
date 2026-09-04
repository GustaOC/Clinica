import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import { clinic } from '@/content/clinic';
import { Header } from '@/components/clinic/header';
import { Photo } from '@/components/clinic/photo';
import { AppointmentButton } from '@/components/clinic/appointment-button';
import { PublicSections } from '@/components/clinic/sections';
import { Footer } from '@/components/clinic/footer';

export default function ArchivedInstitutionalHome() {
  return (
    <>
      <Header contact={clinic.contact} />
      <main id="conteudo">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-panel">
            <Photo
              photo={clinic.heroPhoto}
              label="Um olhar para a nossa clínica"
              className="hero-photo"
              hero
            />
            <div className="hero-copy">
              <p className="eyebrow light">
                <span /> LUMINA · CLÍNICA ESTÉTICA
              </p>
              <h1 id="hero-title">
                Cuidado que
                <br />
                começa com <em>você.</em>
              </h1>
              <p className="hero-description">
                Conheça a clínica, as áreas de atendimento e os profissionais.
                Encontre as informações para planejar sua consulta.
              </p>
              <div className="hero-actions">
                <AppointmentButton
                  contact={clinic.contact}
                  label="Agende sua consulta"
                />
                <a href="#corpo-clinico" className="cta cta-outline">
                  Conheça os especialistas{' '}
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
              <a href="#especialidades" className="hero-explore">
                <span>
                  <ArrowDown size={15} aria-hidden="true" />
                </span>
                Conheça a Lumina
              </a>
            </div>
            {!clinic.heroPhoto && (
              <span className="hero-image-note">
                Imagem oficial da clínica a cadastrar
              </span>
            )}
          </div>
        </section>
        <section
          className="journey-strip container"
          aria-label="Como planejar sua consulta"
        >
          {[
            [
              Stethoscope,
              '01',
              'Encontre seu cuidado',
              'Explore as áreas de atendimento.',
            ],
            [
              UsersRound,
              '02',
              'Conheça quem cuida',
              'Consulte a formação dos profissionais.',
            ],
            [
              CalendarDays,
              '03',
              'Planeje sua consulta',
              'Fale com a clínica e tire suas dúvidas.',
            ],
          ].map(([Icon, number, title, description]) => {
            const JourneyIcon = Icon as typeof Stethoscope;
            return (
              <div className="journey-item" key={String(number)}>
                <JourneyIcon size={23} strokeWidth={1.4} aria-hidden="true" />
                <div>
                  <span className="journey-number">{String(number)}</span>
                  <h2>{String(title)}</h2>
                  <p>{String(description)}</p>
                </div>
              </div>
            );
          })}
        </section>
        <PublicSections />
      </main>
      <Footer />
    </>
  );
}
