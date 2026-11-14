import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useSharedStore,
  type AppSettings,
  type AppUser,
  type Branch,
  type BranchStatus,
} from "../../store/sharedStore";
import { ApiError, ownerManagementApi } from "../../lib/api";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";
import "../../styles/owner-settings.css";
import "../../styles/owner-cabang.css";

const PAGE = 5;

type BranchForm = {
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  pic: string;
  status: BranchStatus;
};

type AccountForm = {
  name: string;
  role: "admin" | "kasir";
  username: string;
  phone: string;
  password: string;
  status: "aktif" | "nonaktif";
};

type DetailTab = "profile" | "accounts";
type ModalMode = "create" | "detail";

const emptyBranchForm = (): BranchForm => ({
  name: "",
  code: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  pic: "",
  status: "Aktif",
});

const emptyAccountForm = (): AccountForm => ({
  name: "",
  role: "admin",
  username: "",
  phone: "",
  password: "",
  status: "aktif",
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

function displayOrDash(value?: string): string {
  const clean = value?.trim();
  return clean && clean !== "-" ? clean : "-";
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
      pic: settings.storePic || (branch.pic === "-" ? "" : branch.pic),
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
    pic: branch.pic === "-" ? "" : branch.pic,
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
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("detail");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("profile");
  const [branchForm, setBranchForm] = useState<BranchForm>(emptyBranchForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [accountError, setAccountError] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountActionError, setAccountActionError] = useState("");
  const [accountActionId, setAccountActionId] = useState<string | null>(null);

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
      branch.type === "Pusat" && (branch.city === "-" || !branch.city)
        ? cityFromAddress(store.settings.storeAddress ?? "")
        : branch.city;
    const address =
      branch.type === "Pusat" && (branch.address === "-" || !branch.address)
        ? store.settings.storeAddress || ""
        : branch.address;

    return { branch, units, sales: sales.length, po: po.length, req: req.length, city, address };
  });

  const retailBranches = store.branches.filter((branch) => branch.type === "Cabang");
  const totalCabang = retailBranches.length;
  const activeCabang = retailBranches.filter((branch) => branch.status === "Aktif").length;
  const totalUnits = rows.reduce((total, row) => total + row.units, 0);
  const centralBranch = store.branches.find((branch) => branch.type === "Pusat") ?? null;

  const centralName = store.settings.storeName || "Optik Mekar Jaya";
  const centralPhone =
    store.settings.storePhone || (centralBranch && centralBranch.phone !== "-" ? centralBranch.phone : "") || "-";
  const centralAddress =
    store.settings.storeAddress || (centralBranch && centralBranch.address !== "-" ? centralBranch.address : "") || "-";
  const centralStatus = centralBranch?.status ?? "Aktif";

  const key = q.trim().toLowerCase();
  const filtered = rows.filter(({ branch, city, address }) =>
    `${branchDisplayName(branch)} ${branch.code} ${branch.type} ${city} ${address} ${branch.pic} ${branch.phone} ${
      branch.email ?? ""
    }`
      .toLowerCase()
      .includes(key),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE, safePage * PAGE);

  const branchAccounts = selectedBranch
    ? store.appUsers.filter(
        (user) =>
          user.branchId === (selectedBranch.dbId ?? selectedBranch.id) && user.role !== "pemilik",
      )
    : [];
  const isCentral = selectedBranch?.type === "Pusat";
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

    setModalMode("detail");
    setSelectedBranch(branch);
    setDetailTab("profile");
    setBranchForm(branchFormFrom(branch, store.settings));
    setFormError("");
    setAccountError("");
    setAccountNotice("");
    setAccountActionError("");
    setModalOpen(true);
    setSearchParams({}, { replace: true });
  }, [hasBranches, searchParams, setSearchParams, store.branches, store.settings]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (accountOpen && !accountSaving) {
        setAccountOpen(false);
        setAccountError("");
        return;
      }
      if (modalOpen && !saving) {
        setModalOpen(false);
        setFormError("");
        setAccountError("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountOpen, accountSaving, modalOpen, saving]);

  function openCreate() {
    setModalMode("create");
    setSelectedBranch(null);
    setDetailTab("profile");
    setBranchForm(emptyBranchForm());
    setFormError("");
    setAccountError("");
    setAccountNotice("");
    setAccountActionError("");
    setModalOpen(true);
  }

  function openDetail(branch: Branch) {
    setModalMode("detail");
    setSelectedBranch(branch);
    setDetailTab("profile");
    setBranchForm(branchFormFrom(branch, store.settings));
    setFormError("");
    setAccountError("");
    setAccountNotice("");
    setAccountActionError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setAccountOpen(false);
    setFormError("");
    setAccountError("");
  }

  function updateBranchForm<K extends keyof BranchForm>(field: K, value: BranchForm[K]) {
    setBranchForm((current) => ({ ...current, [field]: value }));
  }

  function validateBranchForm(): string {
    const name = branchForm.name.trim();
    const code = branchForm.code.trim().toUpperCase();
    const city = branchForm.city.trim();
    const address = branchForm.address.trim();
    const pic = branchForm.pic.trim();
    const email = branchForm.email.trim();

    if (selectedBranch?.type === "Pusat") {
      if (email && !isEmail(email)) return "Format email cabang tidak valid.";
      return "";
    }

    if (name.length < 2) return "Nama cabang minimal 2 karakter.";
    if (!/^[A-Z0-9]{2,8}$/.test(code)) return "Kode cabang 2 sampai 8 karakter, hanya huruf dan angka.";
    if (city.length < 2) return "Kota minimal 2 karakter.";
    if (address.length < 3) return "Alamat minimal 3 karakter.";
    if (pic.length < 2) return "Penanggung jawab minimal 2 karakter.";
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
      if (modalMode === "detail" && selectedBranch?.type === "Pusat") {
        await ownerManagementApi.saveSettings({
          defaultMinimum: store.settings.defaultMinimum,
          storeName: store.settings.storeName,
          storePhone: branchForm.phone.trim(),
          storeAddress: branchForm.address.trim(),
          storeEmail: branchForm.email.trim(),
          storePic: branchForm.pic.trim(),
        });
        await store.refreshOwnerData();
        setNotice("Informasi gudang pusat diperbarui.");
      } else {
        await ownerManagementApi.saveBranch({
          ...(modalMode === "detail" && selectedBranch ? { id: Number(selectedBranch.id) } : {}),
          name: branchForm.name.trim(),
          code: branchForm.code.trim().toUpperCase(),
          city: branchForm.city.trim(),
          address: branchForm.address.trim(),
          phone: branchForm.phone.trim(),
          email: branchForm.email.trim(),
          pic: branchForm.pic.trim(),
          status: branchForm.status,
        });
        await store.refreshOwnerData();
        setNotice(
          modalMode === "detail"
            ? `Data ${branchForm.name.trim()} diperbarui.`
            : `${branchForm.name.trim()} ditambahkan.`,
        );
      }

      setModalOpen(false);
      setAccountOpen(false);
      setPage(1);
    } catch (error) {
      setFormError(errorMessage(error, "Data cabang gagal disimpan."));
    } finally {
      setSaving(false);
    }
  }

  function openAccount() {
    if (!selectedBranch) return;
    setAccountForm(emptyAccountForm());
    setAccountError("");
    setAccountNotice("");
    setAccountActionError("");
    setAccountOpen(true);
  }

  function closeAccount() {
    if (accountSaving) return;
    setAccountOpen(false);
    setAccountError("");
  }

  async function submitAccount(event: FormEvent) {
    event.preventDefault();
    if (!selectedBranch) return;

    setAccountError("");
    const name = accountForm.name.trim();
    const username = accountForm.username.trim();
    const phone = accountForm.phone.trim();

    if (name.length < 2) {
      setAccountError("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (username.length < 2) {
      setAccountError("Username atau email login minimal 2 karakter.");
      return;
    }
    if (accountForm.password.length < 8) {
      setAccountError("Password awal minimal 8 karakter.");
      return;
    }

    const branchId = Number(selectedBranch.dbId ?? selectedBranch.id);
    if (!Number.isFinite(branchId)) {
      setAccountError(
        isCentral
          ? "Akun gudang pusat belum siap. Muat ulang halaman lalu coba lagi."
          : "ID cabang tidak valid.",
      );
      return;
    }

    setAccountSaving(true);
    try {
      const result = await ownerManagementApi.saveUser({
        name,
        username,
        password: accountForm.password,
        role: accountForm.role,
        branchId,
        email: username.includes("@") ? username : "",
        phone,
      });

      let statusNote = "";
      if (accountForm.status === "nonaktif") {
        try {
          await ownerManagementApi.setUserStatus(result.id, "nonaktif");
        } catch {
          statusNote = "Akun dibuat, tetapi status nonaktif gagal diterapkan.";
        }
      }

      await store.refreshOwnerData();
      setAccountOpen(false);
      setAccountNotice(statusNote || `Akun ${name} ditambahkan.`);
      setDetailTab("accounts");
    } catch (error) {
      setAccountError(errorMessage(error, "Akun cabang gagal disimpan."));
    } finally {
      setAccountSaving(false);
    }
  }

  async function toggleAccount(user: AppUser) {
    const nextStatus = user.status === "Aktif" ? "nonaktif" : "aktif";
    if (
      nextStatus === "nonaktif" &&
      !window.confirm(
        `Nonaktifkan akun ${user.name}? Akun tidak bisa login sampai diaktifkan kembali.`,
      )
    ) {
      return;
    }

    setAccountActionId(user.id);
    setAccountActionError("");
    setAccountNotice("");
    try {
      await ownerManagementApi.setUserStatus(Number(user.id), nextStatus);
      await store.refreshOwnerData();
      setAccountNotice(
        nextStatus === "nonaktif" ? `Akun ${user.name} dinonaktifkan.` : `Akun ${user.name} diaktifkan.`,
      );
    } catch (error) {
      setAccountActionError(errorMessage(error, "Status akun gagal diperbarui."));
    } finally {
      setAccountActionId(null);
    }
  }

  function renderBranchFields(central: boolean): ReactNode {
    return (
      <>
        <label className="os-field">
          <span>Nama Cabang</span>
          <input
            className="os-input"
            value={branchForm.name}
            onChange={(event) => updateBranchForm("name", event.target.value)}
            placeholder="Nama cabang"
            disabled={central}
            autoFocus={!central}
          />
        </label>
        <label className="os-field">
          <span>Penanggung Jawab</span>
          <input
            className="os-input"
            value={branchForm.pic}
            onChange={(event) => updateBranchForm("pic", event.target.value)}
            placeholder="Nama penanggung jawab"
            autoComplete="name"
            autoFocus={central}
          />
        </label>
        <label className="os-field">
          <span>Kode Cabang</span>
          <input
            className="os-input"
            value={branchForm.code}
            onChange={(event) => updateBranchForm("code", event.target.value.toUpperCase())}
            placeholder="Kode cabang"
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
            placeholder="(0751) 123456"
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
            placeholder="cabang@email.com"
            autoComplete="email"
          />
        </label>
        <label className="os-field os-field-wide">
          <span>Alamat Lengkap</span>
          <input
            className="os-input"
            value={branchForm.address}
            onChange={(event) => updateBranchForm("address", event.target.value)}
            placeholder="Alamat operasional cabang"
            autoComplete="street-address"
          />
        </label>
        <label className="os-field os-field-wide">
          <span>Kota</span>
          <input
            className="os-input"
            value={central ? cityFromAddress(branchForm.address) : branchForm.city}
            onChange={(event) => updateBranchForm("city", event.target.value)}
            placeholder="Kota"
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
        overline="MONITORING - CABANG"
        title="Monitoring Cabang"
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

          <section className="branch-central-card" aria-labelledby="central-office-title">
            <div className="branch-central-main">
              <span className="branch-central-icon" aria-hidden="true">
                <Building2 size={24} />
              </span>
              <div className="branch-central-copy">
                <span className="branch-central-label">KANTOR PUSAT</span>
                <h2 id="central-office-title">{centralName}</h2>
                <p className="branch-central-role">Pemilik Optik</p>
                <div className="branch-central-contact">
                  <span className="branch-central-contact-row">
                    <Phone size={14} />
                    {displayOrDash(centralPhone)}
                  </span>
                  <span className="branch-central-contact-row">
                    <MapPin size={14} />
                    {displayOrDash(centralAddress)}
                  </span>
                </div>
              </div>
            </div>
            <div className="branch-central-side">
              <StatusPill label={centralStatus} />
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => centralBranch && openDetail(centralBranch)}
                disabled={!centralBranch}
              >
                Lihat Detail
              </button>
            </div>
          </section>

          <div className="toolbar branch-search-row">
            <SearchBox
              placeholder="Cari nama, kode, kota, atau penanggung jawab..."
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
            />
          </div>

          <div className="table-wrap">
            <table className="tt">
              <thead>
                <tr>
                  <th>NAMA LOKASI</th>
                  <th>ALAMAT LOKASI</th>
                  <th>PIC / KONTAK</th>
                  <th className="tt-center">STATUS</th>
                  <th>RINGKASAN</th>
                  <th className="tt-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ branch, units, sales, po, req, city, address }) => (
                  <tr key={branch.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div className="cell-person">
                        <span
                          className="stat-icon"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 13,
                            ...(branch.type === "Pusat"
                              ? { background: "var(--info-bg)", color: "var(--info-ink)" }
                              : {}),
                          }}
                        >
                          {branch.type === "Pusat" ? <Boxes size={19} /> : <Building2 size={19} />}
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
                      <div className="tt-num" style={{ fontSize: 13.5 }}>
                        {displayOrDash(city)}
                      </div>
                      <div className="tt-sub">{displayOrDash(address)}</div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div className="tt-num" style={{ fontSize: 13.5 }}>
                        {displayOrDash(branch.pic)}
                      </div>
                      <div className="tt-sub">{displayOrDash(branch.phone)}</div>
                    </td>
                    <td className="tt-center" style={{ whiteSpace: "nowrap" }}>
                      <StatusPill label={branch.status} />
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
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
                      <button type="button" className="link-action" onClick={() => openDetail(branch)}>
                        <Pencil size={14} />
                        Detail &amp; Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
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
            <div className="table-foot">
              <span className="foot-note">
                Menampilkan {visible.length} dari {filtered.length} lokasi ({totalCabang} cabang ritel -{" "}
                {store.branches.some((branch) => branch.type === "Pusat") ? 1 : 0} gudang pusat)
                {pages > 1 ? ` - Halaman ${safePage} dari ${pages}` : ""}
              </span>
              {pages > 1 ? (
                <div className="foot-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                  >
                    Sebelumnya
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    disabled={safePage >= pages}
                    onClick={() => setPage(safePage + 1)}
                  >
                    Berikutnya
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      {modalOpen ? (
        <div className="overlay" onClick={closeModal}>
          <div
            className="os-modal branch-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-modal-title"
          >
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">
                  {modalMode === "create" ? "TAMBAH CABANG" : "DETAIL CABANG"}
                </span>
                <h2 id="branch-modal-title">
                  {modalMode === "create"
                    ? "Tambah Cabang"
                    : `Detail Cabang: ${selectedBranch ? branchDisplayName(selectedBranch) : ""}`}
                </h2>
                <p>
                  {modalMode === "create"
                    ? "Cabang baru mulai tanpa saldo stok."
                    : "Perbarui profil dan kelola akun pengelola cabang."}
                </p>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={closeModal} disabled={saving}>
                <X size={18} />
              </button>
            </div>

            {modalMode === "detail" ? (
              <div className="os-modal-body branch-detail-body">
                <div className="branch-detail-tabs" role="tablist" aria-label="Detail cabang">
                  <button
                    className={`branch-tab ${detailTab === "profile" ? "is-active" : ""}`}
                    type="button"
                    role="tab"
                    id="branch-tab-profile"
                    aria-selected={detailTab === "profile"}
                    aria-controls="branch-panel-profile"
                    onClick={() => setDetailTab("profile")}
                  >
                    Profil &amp; Operasional
                  </button>
                  <button
                    className={`branch-tab ${detailTab === "accounts" ? "is-active" : ""}`}
                    type="button"
                    role="tab"
                    id="branch-tab-accounts"
                    aria-selected={detailTab === "accounts"}
                    aria-controls="branch-panel-accounts"
                    onClick={() => setDetailTab("accounts")}
                  >
                    Akun Admin &amp; Kasir
                    <span className="branch-tab-count">{branchAccounts.length}</span>
                  </button>
                </div>

                {detailTab === "profile" ? (
                  <form
                    className="branch-tab-panel"
                    id="branch-panel-profile"
                    role="tabpanel"
                    aria-labelledby="branch-tab-profile"
                    onSubmit={submitBranch}
                    noValidate
                  >
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
                  <div
                    className="branch-tab-panel"
                    id="branch-panel-accounts"
                    role="tabpanel"
                    aria-labelledby="branch-tab-accounts"
                  >
                    {accountNotice ? (
                      <div className="branch-inline-notice" role="status">
                        {accountNotice}
                      </div>
                    ) : null}
                    {accountActionError ? (
                      <div className="branch-inline-error" role="alert">
                        {accountActionError}
                      </div>
                    ) : null}

                    <div className="branch-account-toolbar">
                      <p className="branch-tab-desc">Daftar akun pengelola yang bertugas di lokasi ini.</p>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={openAccount}>
                        <Plus size={15} />
                        Tambah Akun Baru
                      </button>
                    </div>

                    {selectedBranch && branchAccounts.length > 0 ? (
                      <div className="branch-account-list">
                        {branchAccounts.map((user) => (
                          <div className="branch-account-row" key={user.id}>
                            <span className="branch-account-avatar">{initialsFromName(user.name)}</span>
                            <div className="branch-account-copy">
                              <b>{user.name}</b>
                              <span className="branch-account-username">{usernameLabel(user.username)}</span>
                            </div>
                            <div className="branch-account-meta">
                              <span className="branch-role-badge">
                                {accountRoleLabel(user, selectedBranch)}
                              </span>
                              {user.status === "Nonaktif" ? <StatusPill label="Nonaktif" /> : null}
                              {user.status === "Aktif" ? (
                                <button
                                  className="branch-account-action"
                                  type="button"
                                  title="Nonaktifkan akun"
                                  aria-label={`Nonaktifkan akun ${user.name}`}
                                  onClick={() => void toggleAccount(user)}
                                  disabled={accountActionId === user.id}
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <button
                                  className="branch-account-action"
                                  type="button"
                                  title="Aktifkan akun"
                                  aria-label={`Aktifkan akun ${user.name}`}
                                  onClick={() => void toggleAccount(user)}
                                  disabled={accountActionId === user.id}
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="branch-account-empty">
                        {isCentral
                          ? "Tidak ada akun admin atau kasir di gudang pusat."
                          : "Belum ada akun admin atau kasir di cabang ini."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form className="os-modal-body" onSubmit={submitBranch} noValidate>
                {formError ? (
                  <div className="form-error" role="alert">
                    {formError}
                  </div>
                ) : null}
                <div className="os-form-grid">{renderBranchFields(false)}</div>
                <div className="os-modal-actions">
                  <button className="btn btn-ghost" type="button" onClick={closeModal} disabled={saving}>
                    Batal
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "Tambah Cabang"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {accountOpen ? (
        <div className="overlay" onClick={closeAccount}>
          <div
            className="os-modal os-modal-sm branch-account-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-account-title"
          >
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">{isCentral ? "TAMBAH AKUN GUDANG" : "TAMBAH AKUN CABANG"}</span>
                <h2 id="branch-account-title">
                  Tambah Akun: {selectedBranch ? branchDisplayName(selectedBranch) : ""}
                </h2>
                <p>
                  {isCentral
                    ? "Akun baru dapat langsung dipakai untuk login ke gudang pusat."
                    : "Akun baru dapat langsung dipakai untuk login ke cabang ini."}
                </p>
              </div>
              <button
                className="icon-pill"
                type="button"
                aria-label="Tutup"
                onClick={closeAccount}
                disabled={accountSaving}
              >
                <X size={18} />
              </button>
            </div>
            <form className="os-modal-body" onSubmit={submitAccount} noValidate>
              {accountError ? (
                <div className="form-error" role="alert">
                  {accountError}
                </div>
              ) : null}
              <div className="os-form">
                <label className="os-field">
                  <span>Nama Lengkap</span>
                  <input
                    className="os-input"
                    value={accountForm.name}
                    onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })}
                    placeholder="Nama lengkap pengelola"
                    autoComplete="name"
                    autoFocus
                  />
                </label>
                <label className="os-field">
                  <span>Peran / Jabatan</span>
                  <select
                    className="os-input"
                    value={accountForm.role}
                    onChange={(event) =>
                      setAccountForm({ ...accountForm, role: event.target.value as AccountForm["role"] })
                    }
                  >
                    <option value="admin">{isCentral ? "Admin Gudang" : "Admin Cabang"}</option>
                    <option value="kasir">{isCentral ? "Kasir Gudang" : "Kasir Cabang"}</option>
                  </select>
                </label>
                <label className="os-field">
                  <span>Username / Email Login</span>
                  <input
                    className="os-input"
                    value={accountForm.username}
                    onChange={(event) => setAccountForm({ ...accountForm, username: event.target.value })}
                    placeholder="cth. admin.cabang atau admin@email.com"
                    autoComplete="username"
                  />
                </label>
                <label className="os-field">
                  <span>Nomor HP / WhatsApp</span>
                  <input
                    className="os-input"
                    type="tel"
                    value={accountForm.phone}
                    onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })}
                    placeholder="08xx xxxx xxxx"
                    autoComplete="tel"
                  />
                </label>
                <label className="os-field">
                  <span>Password Awal</span>
                  <input
                    className="os-input"
                    type="password"
                    value={accountForm.password}
                    onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                  />
                </label>
                <label className="os-field">
                  <span>Status Akun</span>
                  <select
                    className="os-input"
                    value={accountForm.status}
                    onChange={(event) =>
                      setAccountForm({ ...accountForm, status: event.target.value as AccountForm["status"] })
                    }
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </label>
              </div>
              <div className="os-modal-actions">
                <button className="btn btn-ghost" type="button" onClick={closeAccount} disabled={accountSaving}>
                  Batal
                </button>
                <button className="btn btn-primary" type="submit" disabled={accountSaving}>
                  {accountSaving ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
