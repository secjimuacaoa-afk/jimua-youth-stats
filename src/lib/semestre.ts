// Helpers para o ciclo semestral (1: Jan-Jun, 2: Jul-Dez)

export const getSemestreCorrente = (d: Date = new Date()): { semestre: 1 | 2; ano: number } => {
  const mes = d.getMonth() + 1;
  return { semestre: mes <= 6 ? 1 : 2, ano: d.getFullYear() };
};

export const fimSemestre = (semestre: 1 | 2, ano: number): Date =>
  semestre === 1 ? new Date(ano, 5, 30) : new Date(ano, 11, 31);

export const diasParaFimSemestre = (d: Date = new Date()): number => {
  const { semestre, ano } = getSemestreCorrente(d);
  const fim = fimSemestre(semestre, ano);
  return Math.ceil((fim.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
};

export const proximoSemestre = (semestre: 1 | 2, ano: number): { semestre: 1 | 2; ano: number } =>
  semestre === 1 ? { semestre: 2, ano } : { semestre: 1, ano: ano + 1 };
