import Image from 'next/image';
import { Camera } from 'lucide-react';
import type { ClinicPhoto } from '@/content/clinic';

export function Photo({
  photo,
  label,
  className = '',
  hero = false,
}: {
  photo?: ClinicPhoto;
  label: string;
  className?: string;
  hero?: boolean;
}) {
  return (
    <div
      className={`clinic-photo ${className} ${photo ? 'has-photo' : 'photo-pending'}`}
    >
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={
            hero
              ? '(max-width: 760px) 100vw, 60vw'
              : '(max-width: 640px) 100vw, 50vw'
          }
          preload={hero}
          loading={hero ? undefined : 'lazy'}
          className="photo-image"
        />
      ) : (
        <div className="photo-placeholder">
          <span className="photo-icon">
            <Camera size={29} strokeWidth={1.25} aria-hidden="true" />
          </span>
          <span className="photo-placeholder-title">{label}</span>
          <span className="photo-placeholder-note">
            Aguardando fotografia real autorizada
          </span>
        </div>
      )}
    </div>
  );
}
