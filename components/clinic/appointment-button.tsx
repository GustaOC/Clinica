'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Mail,
  MessageCircle,
  Phone,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { emailUrl, phoneUrl, whatsappUrl, type Contact } from '@/lib/contact';

export function AppointmentButton({
  contact,
  label = 'Agendar consulta',
  className = '',
  subject = 'uma consulta',
}: {
  contact: Contact;
  label?: string;
  className?: string;
  subject?: string;
}) {
  const [open, setOpen] = useState(false);
  const whatsapp = whatsappUrl(contact.whatsapp, subject);
  const phone = phoneUrl(contact.phone);
  const email = emailUrl(contact.email);
  const available = Boolean(whatsapp || phone || email);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className={`cta ${className}`} />}>
        <CalendarDays size={17} aria-hidden="true" />
        {label}
        <ArrowUpRight size={17} aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="appointment-dialog" showCloseButton={false}>
        <div className="dialog-emblem">
          <CalendarDays size={24} aria-hidden="true" />
        </div>
        <DialogHeader>
          <DialogTitle className="dialog-title">Vamos conversar?</DialogTitle>
          <DialogDescription>
            {available
              ? 'Escolha um canal para consultar disponibilidade com a clínica. O agendamento será confirmado pela equipe.'
              : 'Os canais oficiais de atendimento ainda não foram informados.'}
          </DialogDescription>
        </DialogHeader>
        <div className="contact-options">
          {whatsapp && (
            <a
              className="contact-option"
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" />
              <span>
                <strong>Conversar pelo WhatsApp</strong>
                <small>Abre uma conversa com a clínica</small>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
          {phone && (
            <a className="contact-option" href={phone}>
              <Phone aria-hidden="true" />
              <span>
                <strong>Ligar para a clínica</strong>
                <small>{contact.phone}</small>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
          {email && (
            <a className="contact-option" href={email}>
              <Mail aria-hidden="true" />
              <span>
                <strong>Enviar um e-mail</strong>
                <small>{contact.email}</small>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
          {!available && (
            <div className="honest-notice">
              <Info size={20} aria-hidden="true" />
              <p>
                <strong>Agendamento ainda indisponível.</strong>
                <br />
                Nenhuma solicitação foi enviada. O botão será conectado ao canal
                oficial assim que a clínica fornecer os dados.
              </p>
            </div>
          )}
        </div>
        <p className="dialog-note">
          Não envie fotos, documentos ou informações sensíveis de saúde por este
          site.
        </p>
        <DialogClose
          render={<Button variant="outline" className="close-action" />}
        >
          Voltar ao site
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
