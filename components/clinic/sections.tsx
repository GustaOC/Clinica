import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FileBadge,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { clinic } from '@/content/clinic';
import { emailUrl, mapsUrl, phoneUrl } from '@/lib/contact';
import { AppointmentButton } from './appointment-button';
import { Curriculum } from './curriculum';
import { Faq } from './faq';
import { Photo } from './photo';

export function PublicSections() {
  const phone = phoneUrl(clinic.contact.phone),
    email = emailUrl(clinic.contact.email),
    maps = mapsUrl(clinic.contact.address);
  const professionals = clinic.professionals.filter(
    (professional) => professional.name.trim() && professional.crm.trim(),
  );
  return (
    <>
      <section id="especialidades" className="section container">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">ÁREAS DE ATENDIMENTO</p>
            <h2 className="section-title">
              O primeiro passo é conhecer
              <br />
              as suas possibilidades.
            </h2>
          </div>
          <p className="section-description">
            {clinic.specialties.length
              ? 'Explore as áreas de atuação da Lumina e converse com a equipe para saber mais.'
              : 'As especialidades serão publicadas após confirmação da clínica. Sem informações presumidas sobre os atendimentos.'}
          </p>
        </div>
        <div className="specialty-grid">
          {clinic.specialties.length
            ? clinic.specialties.map((specialty) => (
                <article className="specialty-card" key={specialty.id}>
                  <div className="specialty-icon">
                    <Stethoscope
                      size={24}
                      strokeWidth={1.4}
                      aria-hidden="true"
                    />
                  </div>
                  <h3>{specialty.name}</h3>
                  <p>{specialty.description}</p>
                  <AppointmentButton
                    contact={clinic.contact}
                    subject={specialty.name}
                    label="Consultar atendimento"
                    className="specialty-cta"
                  />
                </article>
              ))
            : [1, 2, 3].map((number) => (
                <article className="specialty-card reserved-card" key={number}>
                  <div className="specialty-card-top">
                    <span className="specialty-icon">
                      <Stethoscope
                        size={24}
                        strokeWidth={1.4}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="card-index">0{number}</span>
                  </div>
                  <span className="pending-label">CONTEÚDO A CADASTRAR</span>
                  <h3>Especialidade a informar</h3>
                  <p>
                    Nome e descrição da área de atuação, após validação da
                    equipe clínica.
                  </p>
                  <span className="reserved-foot">
                    Aguardando confirmação{' '}
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </article>
              ))}
        </div>
      </section>
      <section id="corpo-clinico" className="team-section">
        <div className="section container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">QUEM ESTÁ AO SEU LADO</p>
              <h2 className="section-title">Conheça quem cuida de você.</h2>
            </div>
            <p className="section-description">
              Formação e registros profissionais em destaque. Os perfis são
              publicados somente com informações oficiais.
            </p>
          </div>
          <div className="professional-grid">
            {professionals.length
              ? professionals.map((professional) => (
                  <article className="professional-card" key={professional.id}>
                    <Photo
                      photo={professional.photo}
                      label="Retrato oficial a cadastrar"
                      className="professional-photo"
                    />
                    <div className="professional-info">
                      <p className="professional-specialty">
                        {professional.specialty}
                      </p>
                      <h3>{professional.name}</h3>
                      <p className="professional-credential">
                        <FileBadge size={14} aria-hidden="true" />
                        {professional.crm}
                        {professional.rqe && ` · ${professional.rqe}`}
                      </p>
                      <Curriculum professional={professional} />
                    </div>
                  </article>
                ))
              : [1, 2, 3].map((number) => (
                  <article className="professional-card" key={number}>
                    <Photo
                      label="Fotografia do profissional"
                      className="professional-photo"
                    />
                    <div className="professional-info">
                      <p className="professional-specialty">
                        PERFIL A CADASTRAR
                      </p>
                      <h3>Profissional a informar</h3>
                      <p className="professional-credential">
                        <FileBadge size={14} aria-hidden="true" />
                        CRM/UF e RQE a informar
                      </p>
                      <span className="curriculum-pending">
                        Currículo disponível após cadastro
                      </span>
                    </div>
                  </article>
                ))}
          </div>
          <p className="section-footnote">
            <ShieldCheck size={15} aria-hidden="true" />
            Nenhum nome, registro ou retrato fictício é utilizado.
          </p>
        </div>
      </section>
      <section id="estrutura" className="section container">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">UM OLHAR PARA A CLÍNICA</p>
            <h2 className="section-title">
              Conheça o espaço
              <br />
              do seu atendimento.
            </h2>
          </div>
          <p className="section-description">
            {clinic.spaces.some((space) => space.photo)
              ? 'Explore os ambientes da clínica pelas fotografias oficiais.'
              : 'Um espaço reservado para fotografias reais da recepção, dos ambientes e dos equipamentos da clínica.'}
          </p>
        </div>
        <div className="space-grid">
          {clinic.spaces.map((space, index) => (
            <figure key={space.title} className={`space-item space-${index}`}>
              <Photo photo={space.photo} label={space.title} />
              <figcaption>
                <span>
                  <small>0{index + 1}</small>
                  {space.title}
                </span>
                {!space.photo && (
                  <span className="space-status">Imagem pendente</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section id="convenios" className="insurance-section">
        <div className="container insurance-inner">
          <div>
            <p className="eyebrow">FORMAS DE ATENDIMENTO</p>
            <h2 className="section-title">Convênios e atendimento.</h2>
            <p className="section-description">
              Consulte a equipe para confirmar cobertura, condições e
              disponibilidade antes da sua consulta.
            </p>
          </div>
          <div className="insurance-panel">
            <HeartHandshake size={32} strokeWidth={1.35} aria-hidden="true" />
            {clinic.insurancePlans.length ? (
              <div>
                <h3>Convênios informados pela clínica</h3>
                <ul className="insurance-list">
                  {clinic.insurancePlans.map((plan) => (
                    <li key={plan}>{plan}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <h3>Convênios a confirmar</h3>
                <p>
                  A clínica ainda não forneceu uma lista oficial.
                  <br />
                  Nenhuma parceria é presumida.
                </p>
              </div>
            )}
            <AppointmentButton
              contact={clinic.contact}
              label="Consultar a clínica"
              className="insurance-cta"
              subject="convênios e formas de atendimento"
            />
          </div>
        </div>
      </section>
      <section className="section container faq-section">
        <div>
          <p className="eyebrow">ANTES DA SUA VISITA</p>
          <h2 className="section-title">
            Informações que
            <br />
            fazem a diferença.
          </h2>
          <p className="section-description">
            Respostas claras para ajudar você a planejar o próximo passo.
          </p>
        </div>
        <Faq />
      </section>
      <section id="contato" className="contact-section">
        <div className="container">
          <div className="contact-cta-panel">
            <div>
              <p className="eyebrow light">VAMOS DAR O PRÓXIMO PASSO?</p>
              <h2 className="section-title">
                O seu cuidado começa
                <br />
                com uma conversa.
              </h2>
              <p>
                Consulte os canais oficiais para tirar dúvidas
                <br className="desktop-break" /> e combinar o melhor momento
                para sua visita.
              </p>
            </div>
            <div className="contact-cta-action">
              <AppointmentButton
                contact={clinic.contact}
                label="Agende sua consulta"
              />
              <span>
                <CalendarDays size={14} aria-hidden="true" />
                Confirmação diretamente com a equipe
              </span>
            </div>
          </div>
          <div className="contact-details">
            <article>
              <MapPin size={21} strokeWidth={1.5} aria-hidden="true" />
              <h3>Onde estamos</h3>
              <p>{clinic.contact.address || 'Endereço oficial a informar.'}</p>
              {maps && (
                <a
                  className="text-action"
                  href={maps}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver no Google Maps{' '}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              )}
            </article>
            <article>
              <Clock3 size={21} strokeWidth={1.5} aria-hidden="true" />
              <h3>Horário de atendimento</h3>
              <p>{clinic.contact.hours || 'Dias e horários a informar.'}</p>
            </article>
            <article>
              <Phone size={21} strokeWidth={1.5} aria-hidden="true" />
              <h3>Fale com a clínica</h3>
              {phone ? (
                <a href={phone}>{clinic.contact.phone}</a>
              ) : (
                <p>Telefone oficial a informar.</p>
              )}
              {email && (
                <a href={email} className="contact-email">
                  <Mail size={13} aria-hidden="true" />
                  {clinic.contact.email}
                </a>
              )}
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
