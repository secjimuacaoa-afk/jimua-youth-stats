// Helpers para o ciclo semestral (1: Jan-Jun, 2: Jul-Dez)

export const getSemestreCorrente = (d: Date = new Date()): { semestre: 1 | 2; ano: number } => {
  const mes = d.getMonth() + 1;
  return { semestre: mes <= 6 ? 1 : 2, ano: d.getFullYear() };
};

/** Deduz ano/semestre a partir de uma data (string ISO ou Date) */
export const semestreDaData = (data: string | Date): { semestre: 1 | 2; ano: number } => {
  const d = typeof data === "string" ? new Date(`${data.slice(0, 10)}T00:00:00`) : data;
  return getSemestreCorrente(d);
};

export const fimSemestre = (semestre: 1 | 2, ano: number): Date =>
  semestre === 1 ? new Date(ano, 5, 30) : new Date(ano, 11, 31);

export const inicioSemestre = (semestre: 1 | 2, ano: number): Date =>
  semestre === 1 ? new Date(ano, 0, 1) : new Date(ano, 6, 1);

export const diasParaFimSemestre = (d: Date = new Date()): number => {
  const { semestre, ano } = getSemestreCorrente(d);
  const fim = fimSemestre(semestre, ano);
  return Math.ceil((fim.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
};

export const proximoSemestre = (semestre: 1 | 2, ano: number): { semestre: 1 | 2; ano: number } =>
  semestre === 1 ? { semestre: 2, ano } : { semestre: 1, ano: ano + 1 };

export const semestreAnterior = (semestre: number, ano: number): { semestre: 1 | 2; ano: number } =>
  semestre === 1 ? { semestre: 2, ano: ano - 1 } : { semestre: 1, ano };

export const labelSemestre = (semestre: number, ano: number) => `${semestre}º Semestre / ${ano}`;

export const periodoTexto = (semestre: number, ano: number) =>
  semestre === 1 ? `01 Jan → 30 Jun ${ano}` : `01 Jul → 31 Dez ${ano}`;
