import React from 'react';
import { Feather } from '@expo/vector-icons';

/**
 * Helper tipado para iconos Feather (@expo/vector-icons).
 * Evita repetir el import y el genérico en cada pantalla.
 *
 * Uso: <AppIcon name="calendar" size={20} color={COLORS.primary} />
 */
export function AppIcon(props: React.ComponentProps<typeof Feather>) {
  return <Feather {...props} />;
}

export type AppIconName = React.ComponentProps<typeof Feather>['name'];
