import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  Info,
  Pencil,
  Plus,
  X,
} from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  useSharedStore,
  type AppSettings,
  type AppUser,
  type Branch,
  type BranchStatus,
} from "../../store/sharedStore";
import { ApiError, ownerManagementApi } from "../../lib/api";
import { useModalDismiss } from "../../lib/useModalDismiss";
import { PageHeader, SearchBox, StatCard, StatusPill, TableCols } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";
import "../../styles/owner-settings.css";
import "../../styles/owner-cabang.css";

type BranchForm = {
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  status: BranchStatus;
};

type ModalMode = "create" | "view" | "edit";

const emptyBranchForm = (): BranchForm => ({
  name: "",
  code: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  status: "Aktif",
});

function initialsFromName(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A"
  );
}
function cleanText(value?: string): string {
  const clean = value?.trim();
  return clean && clean !== "-" ? clean : "";
}

function displayOrDash(value?: string): string {
  return cleanText(value) || "-";
}

function BranchCellStack({
  primary,
  secondary,
  empty = "Belum diisi",
}: {
  primary?: string;
  secondary?: string;
  empty?: string;
}) {
  const first = cleanText(primary);
  const second = cleanText(secondary);
  if (!first && !second) {
    return <div className="tt-sub branch-empty-cell">{empty}</div>;
  }
  if (first && second) {
    return (
      <>
        <div className="tt-num" style={{ fontSize: 13.5 }}>
          {first}
        </div>
        <div className="tt-sub">{second}</div>
      </>
    );
  }
  return (
    <div className="tt-num" style={{ fontSize: 13.5 }}>
      {first || second}
    </div>
  );
}

function cityFromAddress(address: string): string {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function branchDisplayName(branch: Branch): string {
  if (branch.type === "Pusat" && branch.name.trim().toLowerCase() === "pusat") {
    return "Gudang Pusat";
  }
  return branch.name;
}

function branchFormFrom(branch: Branch, settings: AppSettings): BranchForm {
  if (branch.type === "Pusat") {
    return {
      name: branchDisplayName(branch),
      code: branch.code || "PST",
      city: cityFromAddress(settings.storeAddress ?? ""),
      address: settings.storeAddress || (branch.address === "-" ? "" : branch.address),
      phone: settings.storePhone || (branch.phone === "-" ? "" : branch.phone),
      email: settings.storeEmail || branch.email || "",
      status: branch.status,
    };
  }

  return {
    name: branch.name,
    code: branch.code,
    city: branch.city === "-" ? "" : branch.city,
    address: branch.address === "-" ? "" : branch.address,
    phone: branch.phone === "-" ? "" : branch.phone,
    email: branch.email || "",
    status: branch.status,
  };
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function usernameLabel(username?: string): string {
  const clean = username?.trim();
  if (!clean) return "-";
  return clean.includes("@") ? clean : `@${clean}`;
}

function accountRoleLabel(user: AppUser, branch: Branch): string {
  if (user.role === "admin") {
    return branch.type === "Pusat" ? "Admin Gudang" : "Admin Cabang";
  }
  if (user.role === "kasir") return "Kasir";
  return "Pemilik";
}

export default function OwnerCabangPage() {
  const store = useSharedStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState("");
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("view");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<BranchForm>(emptyBranchForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useModalDismiss(modalOpen, closeModal);

  const rows = store.branches.map((branch) => {
    const stock = store.stockForBranch(branch.id);
    const units = stock.reduce((total, row) => total + row.saldo, 0);
    const sales = store.transactions.filter(
      (transaction) => transaction.status === "Selesai" && (transaction.branchId ?? "cabang-padang") === branch.id,
    );
    const po = store.pos.filter(
      (order) => (order.status === "Dipesan" || order.status === "Diproses") && order.branchId === branch.id,
    );
    const req = store.requests.filter(
      (request) =>
        request.branchId === branch.id &&
        request.status !== "Ditolak" &&
        store.allocatedForRequest(request.id, request.productId) <= 0,
    );
    const city =
      branch.type === "Pusat" && !cleanText(branch.city)
        ? cityFromAddress(store.settings.storeAddress ?? "")
        : branch.city;
    const address =
      branch.type === "Pusat" && !cleanText(branch.address)
        ? store.settings.storeAddress || ""
        : branch.address;
    const phone =
      branch.type === "Pusat" && !cleanText(branch.phone)
        ? store.settings.storePhone || ""
        : branch.phone;
    const email =
      branch.type === "Pusat" && !cleanText(branch.email)
        ? store.settings.storeEmail || ""
        : branch.email || "";

    return { branch, units, sales: sales.length, po: po.length, req: req.length, city, address, phone, email };
  });

  const retailBranches = store.branches.filter((branch) => branch.type === "Cabang");
  const totalCabang = retailBranches.length;
  const activeCabang = retailBranches.filter((branch) => branch.status === "Aktif").length;
  const totalUnits = rows.reduce((total, row) => total + row.units, 0);

  const key = q.trim().toLowerCase();
  const filtered = rows.filter(({ branch, city, address, phone, email }) =>
    `${branchDisplayName(branch)} ${branch.code} ${branch.type} ${city} ${address} ${phone} ${email}`
      .toLowerCase()
      .includes(key),
  );

  const branchAccounts = selectedBranch
    ? store.appUsers.filter(
        (user) =>
          user.branchId === (selectedBranch.dbId ?? selectedBranch.id) && user.role !== "pemilik",
      )
    : [];
  const isCentral = selectedBranch?.type === "Pusat";
  const selectedRow = selectedBranch
    ? rows.find((row) => row.branch.id === selectedBranch.id) ?? null
    : null;
  const viewProfile = selectedBranch ? branchFormFrom(selectedBranch, store.settings) : null;
  const hasBranches = store.branches.length > 0;
  const showLoading =
    !hasBranches && (store.ownerDataStatus === "idle" || store.ownerDataStatus === "loading");
  const showError = !hasBranches && store.ownerDataStatus === "error";

  useEffect(() => {
    const branchId = searchParams.get("branch");
    if (!branchId) return;

    const branch = store.branches.find((candidate) => candidate.id === branchId);
    if (!branch) {
      if (hasBranches) setSearchParams({}, { replace: true });
      return;
    }

    setModalMode("view");
    setSelectedBranch(branch);
    setBranchForm(branchFormFrom(branch, store.settings));
    setFormError("");
    setModalOpen(true);
    setSearchParams({}, { replace: true });
  }, [hasBranches, searchParams, setSearchParams, store.branches, store.settings]);

  function openCreate() {
    setModalMode("create");
    setSelectedBranch(null);
    setBranchForm(emptyBranchForm());
    setFormError("");
    setModalOpen(true);
  }

  function openDetail(branch: Branch) {
    setModalMode("view");
    setSelectedBranch(branch);
    setBranchForm(branchFormFrom(branch, store.settings));
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(branch: Branch) {
    setModalMode("edit");
    setSelectedBranch(branch);
    setBranchForm(branchFormFrom(branch, store.settings));
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setFormError("");
  }

  function updateBranchForm<K extends keyof BranchForm>(field: K, value: BranchForm[K]) {
    setBranchForm((current) => ({ ...current, [field]: value }));
  }

  function validateBranchForm(): string {
    const name = branchForm.name.trim();
    const code = branchForm.code.trim().toUpperCase();
    const city = branchForm.city.trim();
    const address = branchForm.address.trim();
    const email = branchForm.email.trim();

    if (selectedBranch?.type === "Pusat") {
      if (email && !isEmail(email)) return "Format email cabang tidak valid.";
      return "";
    }

    if (name.length < 2) return "Nama cabang minimal 2 karakter.";
    if (!/^[A-Z0-9]{2,8}$/.test(code)) return "Kode cabang 2 sampai 8 karakter, hanya huruf dan angka.";
    if (city.length < 2) return "Kota minimal 2 karakter.";
    if (address.length < 3) return "Alamat minimal 3 karakter.";
    if (email && !isEmail(email)) return "Format email cabang tidak valid.";
    return "";
  }

  async function submitBranch(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    const validation = validateBranchForm();
    if (validation) {
      setFormError(validation);
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "edit" && selectedBranch?.type === "Pusat") {
        await ownerManagementApi.saveSettings({
          defaultMinimum: store.settings.defaultMinimum,
          storeName: store.settings.storeName,
          storePhone: branchForm.phone.trim(),
          storeAddress: branchForm.address.trim(),
          storeEmail: branchForm.email.trim(),
          storePic: "",
        });
        await store.refreshOwnerData();
        setNotice("Informasi gudang pusat diperbarui.");
      } else {
        const savedCode = branchForm.code.trim().toUpperCase();
        const existingId =
          modalMode === "edit" && selectedBranch ? Number(selectedBranch.id) : undefined;
        await ownerManagementApi.saveBranch({
          ...(existingId !== undefined && Number.isFinite(existingId) ? { id: existingId } : {}),
          name: branchForm.name.trim(),
          code: savedCode,
          city: branchForm.city.trim(),
          address: branchForm.address.trim(),
          phone: branchForm.phone.trim(),
          email: branchForm.email.trim(),
          pic: "",
          status: branchForm.status,
        });

        await store.refreshOwnerData();
        setNotice(
          modalMode === "edit"
            ? `Data ${branchForm.name.trim()} diperbarui.`
            : `${branchForm.name.trim()} ditambahkan. Akun pengelola dapat dibuat di menu Pengguna.`,
        );
      }

      setModalOpen(false);
    } catch (error) {
      setFormError(errorMessage(error, "Data cabang gagal disimpan."));
    } finally {
      setSaving(false);
    }
  }

  function renderBranchFields(central: boolean): ReactNode {
    return (
      <>
        <label className="os-field os-field-wide">
          <span>Nama Cabang</span>
          <input
            className="os-input"
            value={branchForm.name}
            onChange={(event) => updateBranchForm("name", event.target.value)}

            disabled={central}
            autoFocus={!central}
          />
        </label>
        <label className="os-field">
          <span>Kode Cabang</span>
          <input
            className="os-input"
            value={branchForm.code}
            onChange={(event) => updateBranchForm("code", event.target.value.toUpperCase())}

            maxLength={8}
            disabled={central}
          />
        </label>
        <label className="os-field">
          <span>Status</span>
          <select
            className="os-input"
            value={branchForm.status}
            onChange={(event) => updateBranchForm("status", event.target.value as BranchStatus)}
            disabled={central}
          >
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </label>
        <label className="os-field">
          <span>Nomor Telepon</span>
          <input
            className="os-input"
            type="tel"
            value={branchForm.phone}
            onChange={(event) => updateBranchForm("phone", event.target.value)}

            autoComplete="tel"
            autoFocus={central}
          />
        </label>
        <label className="os-field">
          <span>Email Cabang</span>
          <input
            className="os-input"
            type="email"
            value={branchForm.email}
            onChange={(event) => updateBranchForm("email", event.target.value)}

            autoComplete="email"
          />
        </label>
        <label className="os-field os-field-wide">
          <span>Alamat Lengkap</span>
          <input
            className="os-input"
            value={branchForm.address}
            onChange={(event) => updateBranchForm("address", event.target.value)}

            autoComplete="street-address"
          />
        </label>
        <label className="os-field os-field-wide">
          <span>Kota</span>
          <input
            className="os-input"
            value={central ? cityFromAddress(branchForm.address) : branchForm.city}
            onChange={(event) => updateBranchForm("city", event.target.value)}

            autoComplete="address-level2"
            disabled={central}
          />
        </label>
      </>
    );
  }

  return (
    <div className="page branch-page">
      <PageHeader
        title="Manajemen Cabang"
        actions={
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            <Plus size={16} />
            Tambah Cabang
          </button>
        }
      />

      {notice ? (
        <div className="notice notice-ok" role="status">
          {notice}
          <button className="icon-pill" type="button" aria-label="Tutup" onClick={() => setNotice("")} style={{ marginLeft: "auto" }}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      {showLoading ? (
        <div className="branch-state" role="status">
          Memuat data cabang...
        </div>
      ) : showError ? (
        <div className="branch-state branch-state-error" role="alert">
          <div>{store.ownerDataError || "Data cabang gagal dimuat."}</div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => void store.refreshOwnerData()}>
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <div className="stat-row">
            <StatCard
              label="Total Cabang"
              value={String(totalCabang)}
              caption={`${store.branches.length} lokasi termasuk gudang pusat`}
              icon={<Building2 size={22} />}
              tone="violet"
            />
            <StatCard
              label="Cabang Aktif"
              value={String(activeCabang)}
              caption="Siap melayani operasional"
              icon={<CheckCircle2 size={22} />}
              tone="green"
            />
            <StatCard
              label="Total Stok Seluruh Lokasi"
              value={`${totalUnits} unit`}
              caption="Akumulasi stok pusat & cabang"
              icon={<Boxes size={22} />}
              tone="blue"
            />
          </div>

          <div className="toolbar branch-search-row">
            <SearchBox

              value={q}
              onChange={setQ}
            />
          </div>

          <div className="table-wrap">
            <table className="tt owner-table">
              <TableCols widths={["25%", "24%", "12%", "19%", "20%"]} />
              <thead>
                <tr>
                  <th>NAMA LOKASI</th>
                  <th>ALAMAT LOKASI</th>
                  <th className="tt-center">STATUS</th>
                  <th>RINGKASAN</th>
                  <th className="tt-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ branch, units, sales, po, req, city, address }) => (
                  <tr key={branch.id}>
                    <td>
                      <div className="cell-person">
                        <span
                          className="stat-icon"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            ...(branch.type === "Pusat"
                              ? { background: "var(--info-bg)", color: "var(--info-ink)" }
                              : {}),
                          }}
                        >
                          {branch.type === "Pusat" ? <Boxes size={18} /> : <Building2 size={18} />}
                        </span>
                        <span>
                          <b>{branchDisplayName(branch)}</b>
                          <span>
                            {branch.code} - {branch.type === "Pusat" ? "Gudang Pusat" : "Cabang Ritel"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <BranchCellStack primary={address} secondary={city} />
                    </td>
                    <td className="tt-center">
                      <StatusPill label={branch.status} />
                    </td>
                    <td>
                      {branch.type === "Pusat" ? (
                        <>
                          <div className="tt-num" style={{ fontSize: 13.5 }}>
                            {units} unit stok
                          </div>
                          <div className="tt-sub">Gudang distribusi utama</div>
                        </>
                      ) : (
                        <>
                          <div className="tt-num" style={{ fontSize: 13.5 }}>
                            {units} unit - {sales} transaksi
                          </div>
                          <div className="tt-sub">
                            {po} PO aktif - {req} pengajuan
                          </div>
                        </>
                      )}
                    </td>
                    <td className="tt-right">
                      <div className="branch-row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm branch-action-btn"
                          onClick={() => openEdit(branch)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm branch-action-btn"
                          onClick={() => openDetail(branch)}
                        >
                          Detail
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-note">
                        {hasBranches
                          ? "Tidak ada cabang yang cocok dengan pencarian."
                          : "Belum ada data cabang. Tambahkan cabang pertama."}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalOpen ? (
        <div className="overlay" onClick={closeModal}>
          <div
            className={`os-modal branch-modal${
              modalMode === "create"
                ? " branch-create-modal"
                : modalMode === "view"
                  ? " branch-view-modal"
                  : ""
            }`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-modal-title"
          >
            <div className="os-modal-head">
              <div>
                {modalMode === "view" ? (
                  <span className="os-eyebrow">
                    {isCentral ? "DETAIL GUDANG PUSAT" : "DETAIL CABANG"}
                  </span>
                ) : null}
                <h2 id="branch-modal-title">
                  {modalMode === "create"
                    ? "Tambah Cabang Baru"
                    : modalMode === "view"
                      ? selectedBranch
                        ? branchDisplayName(selectedBranch)
                        : ""
                      : isCentral
                        ? "Edit Gudang Pusat"
                        : `Edit Cabang: ${selectedBranch ? branchDisplayName(selectedBranch) : ""}`}
                </h2>
                {modalMode === "view" ? (
                  <p>Informasi lengkap profil operasional dan daftar akun pengelola lokasi.</p>
                ) : null}
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={closeModal} disabled={saving}>
                <X size={18} />
              </button>
            </div>

            {modalMode === "view" && selectedBranch && viewProfile ? (
              <div className="os-modal-body branch-view-body">
                <div className="branch-info-grid">
                  <div className="branch-info-card">
                    <span className="branch-info-label">NAMA LOKASI</span>
                    <b className="branch-info-value">{branchDisplayName(selectedBranch)}</b>
                  </div>
                  <div className="branch-info-card">
                    <span className="branch-info-label">KODE &amp; JENIS LOKASI</span>
                    <b className="branch-info-value">
                      {selectedBranch.code} · {isCentral ? "Gudang Pusat" : "Cabang Ritel"}
                    </b>
                  </div>
                  <div className="branch-info-card">
                    <span className="branch-info-label">STATUS OPERASIONAL</span>
                    <div className="branch-info-pill">
                      <StatusPill label={selectedBranch.status} />
                    </div>
                  </div>
                  <div className="branch-info-card">
                    <span className="branch-info-label">KOTA</span>
                    <b className="branch-info-value">{displayOrDash(viewProfile.city)}</b>
                  </div>
                  <div className="branch-info-card">
                    <span className="branch-info-label">NOMOR TELEPON</span>
                    <b className="branch-info-value">{displayOrDash(viewProfile.phone)}</b>
                  </div>
                  <div className="branch-info-card">
                    <span className="branch-info-label">EMAIL LOKASI</span>
                    <b className="branch-info-value">{displayOrDash(viewProfile.email)}</b>
                  </div>
                </div>

                <div className="branch-info-card">
                  <span className="branch-info-label">ALAMAT LOKASI</span>
                  <b className="branch-info-value">{displayOrDash(viewProfile.address)}</b>
                </div>

                <div className="branch-info-summary">
                  <div>
                    <span className="branch-info-label">RINGKASAN STOK &amp; AKTIVITAS</span>
                    <b className="branch-info-value">{selectedRow?.units ?? 0} unit stok tersedia</b>
                  </div>
                  <span className="branch-info-summary-meta">
                    {isCentral
                      ? "Gudang distribusi utama"
                      : `${selectedRow?.sales ?? 0} transaksi · ${selectedRow?.po ?? 0} PO aktif · ${selectedRow?.req ?? 0} pengajuan`}
                  </span>
                </div>

                <div className="branch-account-section branch-view-accounts">
                  <div className="branch-account-section-copy">
                    <h3>
                      Akun Admin &amp; Kasir
                      <Info size={14} />
                    </h3>
                    <p>Daftar akun pengelola yang bertugas pada lokasi ini (tampilan baca saja).</p>
                  </div>

                  {branchAccounts.length > 0 ? (
                    <div className="branch-account-list">
                      {branchAccounts.map((user) => (
                        <div className="branch-account-row" key={user.id}>
                          <span className="branch-account-avatar">{initialsFromName(user.name)}</span>
                          <div className="branch-account-copy">
                            <div className="branch-account-name-row">
                              <b>{user.name}</b>
                              <StatusPill label={user.status} />
                            </div>
                            <span className="branch-account-username">
                              {[user.email || usernameLabel(user.username), user.phone].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                          <div className="branch-account-meta">
                            <span className="branch-role-badge">
                              {accountRoleLabel(user, selectedBranch)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="branch-account-empty branch-account-empty-box">
                      {isCentral
                        ? "Tidak ada akun admin atau kasir di gudang pusat."
                        : "Belum ada akun admin atau kasir di cabang ini."}
                    </div>
                  )}
                </div>

                <div className="os-modal-actions branch-view-actions">
                  <button className="btn btn-ghost branch-action-btn" type="button" onClick={closeModal}>
                    Tutup
                  </button>
                </div>
              </div>
            ) : modalMode === "edit" ? (
              <form className="os-modal-body branch-detail-body" onSubmit={submitBranch} noValidate>
                {formError ? (
                  <div className="form-error" role="alert">
                    {formError}
                  </div>
                ) : null}
                <div className="os-form-grid">{renderBranchFields(Boolean(isCentral))}</div>
                <div className="os-modal-actions">
                  <button className="btn btn-ghost" type="button" onClick={closeModal} disabled={saving}>
                    Batal
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            ) : (
              <form className="os-modal-body branch-create-body" onSubmit={submitBranch} noValidate>
                {formError ? (
                  <div className="form-error" role="alert">
                    {formError}
                  </div>
                ) : null}
                <div className="os-form">
                  <div className="os-form-grid">
                    <label className="os-field os-field-wide">
                      <span>
                        Nama Cabang
                        <em className="os-required" aria-hidden="true">*</em>
                      </span>
                      <input
                        className="os-input"
                        value={branchForm.name}
                        onChange={(event) => updateBranchForm("name", event.target.value)}

                        autoFocus
                      />
                    </label>
                    <label className="os-field">
                      <span>
                        Kode Cabang
                        <em className="os-required" aria-hidden="true">*</em>
                      </span>
                      <input
                        className="os-input"
                        value={branchForm.code}
                        onChange={(event) => updateBranchForm("code", event.target.value.toUpperCase())}

                        maxLength={8}
                      />
                    </label>
                    <label className="os-field">
                      <span>Status</span>
                      <select
                        className="os-input"
                        value={branchForm.status}
                        onChange={(event) => updateBranchForm("status", event.target.value as BranchStatus)}
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Nonaktif">Nonaktif</option>
                      </select>
                    </label>
                    <label className="os-field">
                      <span>Nomor Telepon</span>
                      <input
                        className="os-input"
                        type="tel"
                        value={branchForm.phone}
                        onChange={(event) => updateBranchForm("phone", event.target.value)}

                        autoComplete="tel"
                      />
                    </label>
                    <label className="os-field">
                      <span>Email Cabang</span>
                      <input
                        className="os-input"
                        type="email"
                        value={branchForm.email}
                        onChange={(event) => updateBranchForm("email", event.target.value)}

                        autoComplete="email"
                      />
                    </label>
                    <label className="os-field os-field-wide">
                      <span>
                        Alamat Lengkap
                        <em className="os-required" aria-hidden="true">*</em>
                      </span>
                      <input
                        className="os-input"
                        value={branchForm.address}
                        onChange={(event) => updateBranchForm("address", event.target.value)}

                        autoComplete="street-address"
                      />
                    </label>
                    <label className="os-field os-field-wide">
                      <span>Kota</span>
                      <input
                        className="os-input"
                        value={branchForm.city}
                        onChange={(event) => updateBranchForm("city", event.target.value)}

                        autoComplete="address-level2"
                      />
                    </label>
                  </div>
                </div>
                <div className="os-modal-actions">
                  <button className="btn btn-ghost branch-action-btn" type="button" onClick={closeModal} disabled={saving}>
                    Batal
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan Cabang Baru"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

    </div>
  );
}
