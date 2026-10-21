import { describe, expect, it } from 'vitest';
import { passesJuniorFilter } from './start';

describe('passesJuniorFilter (exercice 05)', () => {
  it('écarte un poste senior', () => {
    expect(passesJuniorFilter('Développeur Senior')).toBe(false);
    expect(passesJuniorFilter('Lead developer')).toBe(false);
  });

  it('garde toujours une alternance, un stage ou un junior', () => {
    expect(passesJuniorFilter('Développeur senior en alternance')).toBe(true);
    expect(passesJuniorFilter('Stage data')).toBe(true);
    expect(passesJuniorFilter('Développeur junior')).toBe(true);
  });

  it('ne traite pas « manager » ni « responsable » comme exclusion', () => {
    expect(passesJuniorFilter('Community Manager')).toBe(true);
    expect(passesJuniorFilter('Responsable commercial')).toBe(true);
  });

  it('garde un poste neutre', () => {
    expect(passesJuniorFilter('Développeur web')).toBe(true);
  });
});
