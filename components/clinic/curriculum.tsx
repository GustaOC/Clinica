'use client';

import { ArrowUpRight, GraduationCap } from 'lucide-react';
import type { Professional } from '@/content/clinic';
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

export function Curriculum({ professional }: { professional: Professional }) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" className="text-action" />}
      >
        Conheça a formação <ArrowUpRight size={16} aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="appointment-dialog" showCloseButton={false}>
        <div className="dialog-emblem">
          <GraduationCap aria-hidden="true" />
        </div>
        <DialogHeader>
          <DialogTitle className="dialog-title">
            {professional.name}
          </DialogTitle>
          <DialogDescription>
            {professional.specialty} · {professional.crm}
            {professional.rqe && ` · ${professional.rqe}`}
          </DialogDescription>
        </DialogHeader>
        {professional.curriculum.length > 0 ? (
          <ul className="curriculum-list">
            {professional.curriculum.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="dialog-note">
            Currículo ainda não informado pela clínica.
          </p>
        )}
        <DialogClose
          render={<Button variant="outline" className="close-action" />}
        >
          Fechar currículo
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
