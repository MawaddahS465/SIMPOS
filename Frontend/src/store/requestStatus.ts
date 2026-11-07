/**
 * Status pengajuan diturunkan dari keputusan dan penerimaan nyata.
 * Satu sumber data: status tidak bisa bertentangan dengan jumlah yang
 * benar-benar dialokasikan/diterima.
 */
export type RequestDecision = "Diajukan" | "Sebagian" | "Terpenuhi";
export type RequestState = "Diajukan" | "Sebagian" | "Dialokasikan" | "Selesai" | "Ditolak";

export function requestDecision(requested: number, allocated: number): RequestDecision {
  if (allocated <= 0) return "Diajukan";
  if (allocated >= requested) return "Terpenuhi";
  return "Sebagian";
}

/** Label status untuk tampilan; nilai internal tetap dipakai untuk filter. */
export function requestDecisionLabel(status: RequestDecision): string {
  return status === "Diajukan" ? "Menunggu Tinjauan" : status;
}

/** Pengajuan masih menunggu keputusan selama belum ada alokasi sama sekali. */
export function isAwaitingDecision(allocated: number): boolean {
  return allocated <= 0;
}

/**
 * Tahapan resmi: Diajukan → Sebagian → Dialokasikan → Selesai.
 * Ditolak hanya sah sebelum ada alokasi. Selesai menunggu barang diterima.
 */
export function requestState(
  request: { status?: string },
  requested: number,
  allocated: number,
  received = 0,
): RequestState {
  if (request.status === "Ditolak") return "Ditolak";
  if (requested > 0 && received >= requested) return "Selesai";
  if (requested > 0 && allocated >= requested) return "Dialokasikan";
  if (allocated > 0) return "Sebagian";
  return "Diajukan";
}

export function requestStateLabel(state: RequestState): string {
  switch (state) {
    case "Ditolak":
      return "Ditolak";
    case "Sebagian":
      return "Sebagian Dialokasikan";
    case "Dialokasikan":
      return "Menunggu Diterima";
    case "Selesai":
      return "Selesai";
    default:
      return "Menunggu Tinjauan";
  }
}

export function isAwaitingDecisionState(state: RequestState): boolean {
  return state === "Diajukan";
}
