'use client';

import { Menu, Phone, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type Contact, phoneUrl } from '@/lib/contact';
import { Brand } from './brand';
import { AppointmentButton } from './appointment-button';

export const navigation = [
  ['Especialidades', 'especialidades'],
  ['Corpo clínico', 'corpo-clinico'],
  ['Estrutura', 'estrutura'],
  ['Convênios', 'convenios'],
  ['Contato', 'contato'],
] as const;

export function Header({ contact }: { contact: Contact }) {
  const phone = phoneUrl(contact.phone);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegação principal">
          {navigation.map(([title, id]) => (
            <Link key={id} href={`/#${id}`}>
              {title}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {phone ? (
            <a className="header-phone" href={phone}>
              <Phone size={17} aria-hidden="true" />
              <span>{contact.phone}</span>
            </a>
          ) : (
            <span className="header-phone pending-phone">
              <Phone size={17} aria-hidden="true" />
              <span>Telefone a informar</span>
            </span>
          )}
          <AppointmentButton contact={contact} className="header-cta" />
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  className="mobile-menu-button"
                  aria-label="Abrir navegação"
                />
              }
            >
              <Menu size={24} />
            </DialogTrigger>
            <DialogContent
              className="mobile-navigation"
              showCloseButton={false}
            >
              <div className="mobile-nav-heading">
                <DialogTitle>Explore a Lumina</DialogTitle>
                <DialogClose
                  render={
                    <Button
                      variant="ghost"
                      className="mobile-menu-button"
                      aria-label="Fechar navegação"
                    />
                  }
                >
                  <X />
                </DialogClose>
              </div>
              <nav aria-label="Navegação no celular">
                {navigation.map(([title, id]) => (
                  <DialogClose
                    key={id}
                    nativeButton={false}
                    render={<Link href={`/#${id}`} aria-label={title} />}
                  >
                    {title}
                  </DialogClose>
                ))}
              </nav>
              <AppointmentButton contact={contact} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
