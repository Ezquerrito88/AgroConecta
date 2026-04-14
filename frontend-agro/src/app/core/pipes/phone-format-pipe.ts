import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'phoneFormat', standalone: true })
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Quitar todo lo que no sea dígito o +
    const clean = value.replace(/[^\d+]/g, '');

    // Formato español: +34 600 000 000
    if (clean.startsWith('+34') && clean.length === 12) {
      return `+34 ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
    }

    // Móvil sin prefijo: 600 000 000
    if (clean.length === 9) {
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    }

    // Si no encaja, devolver tal cual
    return value;
  }
}