import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const teamColors = [
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500', text: 'text-red-500' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-500' },
  { name: 'Green', value: '#10b981', bg: 'bg-green-500', text: 'text-green-500' },
  { name: 'Yellow', value: '#f59e0b', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-500' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-500' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500', text: 'text-orange-500' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500', text: 'text-teal-500' },
];

export function getTeamColor(colorValue: string) {
  return teamColors.find(c => c.value === colorValue) || teamColors[0];
}
