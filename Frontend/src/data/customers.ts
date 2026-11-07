export type Customer = {
  id: string;
  code: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  hasResep: boolean;
  resepDate?: string;
  poActive: number;
  branch: string;
};

/** Data pelanggan DEMO untuk simulasi frontend. */
export const CUSTOMERS: Customer[] = [
  { id: "C-01", code: "PLG-0042", name: "Andi Saputra", initials: "AS", phone: "0812 3456 7890", email: "andi.saputra@gmail.com", hasResep: true, resepDate: "12 Mar 2026", poActive: 1, branch: "Padang" },
  { id: "C-02", code: "PLG-0001", name: "Rian Pratama", initials: "RP", phone: "0852 7712 9011", email: "rian.pratama@gmail.com", hasResep: true, resepDate: "02 Feb 2026", poActive: 1, branch: "Padang" },
  { id: "C-03", code: "PLG-0002", name: "Siti Maulida", initials: "SM", phone: "0812 3456 7890", email: "siti.maulida@gmail.com", hasResep: true, resepDate: "20 Jan 2026", poActive: 0, branch: "Padang" },
  { id: "C-04", code: "PLG-0003", name: "Andi Pratama", initials: "AP", phone: "0813 8765 4321", email: "andi.pratama@gmail.com", hasResep: false, poActive: 0, branch: "Padang" },
  { id: "C-05", code: "PLG-0004", name: "Nadia Amelia", initials: "NA", phone: "0821 6677 8899", email: "nadia.amelia@gmail.com", hasResep: true, resepDate: "05 Jan 2026", poActive: 2, branch: "Padang" },
  { id: "C-06", code: "PLG-0005", name: "Dimas Hidayat", initials: "DH", phone: "0853 1122 3344", email: "dimas.h@gmail.com", hasResep: true, resepDate: "18 Des 2025", poActive: 0, branch: "Padang" },
  { id: "C-07", code: "PLG-0006", name: "Fitri Putri", initials: "FP", phone: "0819 5566 7788", email: "fitri.putri@gmail.com", hasResep: false, poActive: 1, branch: "Padang" },
  { id: "C-08", code: "PLG-0007", name: "Dedi Rahman", initials: "DR", phone: "0813 6677 8899", email: "dedi.rahman@gmail.com", hasResep: true, resepDate: "30 Nov 2025", poActive: 0, branch: "Padang" },
  { id: "C-09", code: "PLG-0008", name: "Fitri Ananda", initials: "FA", phone: "0851 2233 4455", email: "fitri.ananda@gmail.com", hasResep: false, poActive: 0, branch: "Padang" },
];

/** Resep sampel per pelanggan (DEMO). */
export type Resep = {
  od: { sph: string; cyl: string; axis: string };
  os: { sph: string; cyl: string; axis: string };
  pd: string;
  add?: string;
  note?: string;
};

export const RESEP_MAP: Record<string, Resep> = {
  "C-01": { od: { sph: "-1.50", cyl: "-0.75", axis: "180" }, os: { sph: "-1.25", cyl: "-0.50", axis: "170" }, pd: "32.0", add: "+1.00" },
  "C-02": { od: { sph: "-1.50", cyl: "-0.75", axis: "180" }, os: { sph: "-1.25", cyl: "-0.50", axis: "170" }, pd: "32.0", add: "+1.00" },
  "C-05": { od: { sph: "SPH 1.25", cyl: "-0.50", axis: "175" }, os: { sph: "SPH -1.00", cyl: "-0.25", axis: "170" }, pd: "31.5", add: "+1.50" },
};