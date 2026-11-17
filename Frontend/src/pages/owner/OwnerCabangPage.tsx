import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Pencil,
  Plus,
  Trash2,
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
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
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

type AccountForm = {
  name: string;
  role: "admin" | "kasir";
  username: string;
  phone: string;
  password: string;
  status: "aktif" | "nonaktif";
};

type PendingAccount = AccountForm & { key: string };

type DetailTab = "profile" | "accounts";
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

  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdBranchId, setCreatedBranchId] = useState<number | null>(null);

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
    setCreatedBranchId(null);
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
      if (createAccountOpen && !saving) {
        setCreateAccountOpen(false);
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
  }, [accountOpen, accountSaving, createAccountOpen, modalOpen, saving]);

  function openCreate() {
    setModalMode("create");
    setSelectedBranch(null);
    setCreatedBranchId(null);
    setDetailTab("profile");
    setBranchForm(emptyBranchForm());
    setFormError("");
    setAccountError("");
    setAccountNotice("");
    setAccountActionError("");
    setPendingAccounts([]);
    setCreateAccountOpen(false);
    setShowCreatePassword(false);
    setModalOpen(true);
  }

  function openDetail(branch: Branch) {
    setModalMode("view");
    setSelectedBranch(branch);
    setCreatedBranchId(null);
    setDetailTab("profile");
    setBranchForm(branchFormFrom(branch, store.settings));
    setFormError("");
    setAccountError("");
    setAccountNotice("");
    setAccountActionError("");
    setModalOpen(true);
  }

  function openEdit(branch: Branch) {
    setModalMode("edit");
    setSelectedBranch(branch);
    setCreatedBranchId(null);
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
    setCreateAccountOpen(false);
    setCreatedBranchId(null);
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
          modalMode === "edit" && selectedBranch
            ? Number(selectedBranch.id)
            : createdBranchId !== null
              ? createdBranchId
              : undefined;
        const savedBranches = await ownerManagementApi.saveBranch({
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

        const matchedBranch = savedBranches.find(
          (candidate) => candidate.kode_cabang.toUpperCase() === savedCode,
        );
        const resolvedIdRaw = matchedBranch?.db_id ?? matchedBranch?.id ?? existingId;
        const branchId = typeof resolvedIdRaw === "number" ? resolvedIdRaw : Number(resolvedIdRaw);

        if (modalMode === "create" && Number.isFinite(branchId)) {
          setCreatedBranchId(branchId);
        }

        if (modalMode === "create" && pendingAccounts.length > 0) {
          if (!Number.isFinite(branchId)) {
            await store.refreshOwnerData();
            setFormError(
              "Cabang tersimpan, tetapi ID cabang belum siap sehingga akun karyawan belum dibuat. Tambahkan akun melalui tombol Edit.",
            );
            setPendingAccounts([]);
            return;
          }

          const failed: PendingAccount[] = [];
          for (const account of pendingAccounts) {
            try {
              const result = await ownerManagementApi.saveUser({
                name: account.name,
                username: account.username,
                password: account.password,
                role: account.role,
                branchId,
                email: account.username.includes("@") ? account.username : "",
                phone: account.phone,
              });
              if (account.status === "nonaktif") {
                await ownerManagementApi.setUserStatus(result.id, "nonaktif");
              }
            } catch {
              failed.push(account);
            }
          }

          await store.refreshOwnerData();
          if (failed.length > 0) {
            const savedCount = pendingAccounts.length - failed.length;
            setPendingAccounts(failed);
            setFormError(
              `${branchForm.name.trim()} tersimpan. ${savedCount} akun dibuat, ${failed.length} gagal disimpan. Periksa data akun lalu klik Simpan Cabang Baru untuk mencoba lagi.`,
            );
            return;
          }
        }

        await store.refreshOwnerData();
        setNotice(
          modalMode === "edit"
            ? `Data ${branchForm.name.trim()} diperbarui.`
            : `${branchForm.name.trim()} ditambahkan.`,
        );
      }

      setModalOpen(false);
      setAccountOpen(false);
      setCreateAccountOpen(false);
      setCreatedBranchId(null);
      setPendingAccounts([]);
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
    setShowPassword(false);
    setAccountOpen(true);
  }

  function openCreateAccount() {
    setAccountForm(emptyAccountForm());
    setAccountError("");
    setShowCreatePassword(false);
    setCreateAccountOpen(true);
  }

  function closeCreateAccount() {
    setCreateAccountOpen(false);
    setAccountError("");
  }

  function submitCreateAccount(event: FormEvent) {
    event.preventDefault();

    const name = accountForm.name.trim();
    const username = accountForm.username.trim();

    if (name.length < 2) {
      setAccountError("Nama lengkap karyawan minimal 2 karakter.");
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
    if (pendingAccounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
      setAccountError("Username tersebut sudah ada di daftar akun cabang ini.");
      return;
    }

    setPendingAccounts((current) => [
      ...current,
      { ...accountForm, name, username, phone: accountForm.phone.trim(), key: `${Date.now()}-${current.length}` },
    ]);
    setAccountForm(emptyAccountForm());
    setShowCreatePassword(false);
    setAccountError("");
    setCreateAccountOpen(false);
  }

  function removePendingAccount(key: string) {
    setPendingAccounts((current) => current.filter((account) => account.key !== key));
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
        <label className="os-field os-field-wide">
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

          <div className="toolbar branch-search-row">
            <SearchBox
              placeholder="Cari nama, kode, kota, atau alamat..."
              value={q}
              onChange={setQ}
            />
          </div>

          <div className="table-wrap">
            <table className="tt">
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
                      <BranchCellStack primary={address} secondary={city} />
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
                    <td className="tt-right" style={{ whiteSpace: "nowrap" }}>
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
            <div className="table-foot">
              <span className="foot-note">
                Menampilkan {filtered.length} dari {rows.length} lokasi ({totalCabang} cabang ritel ·{" "}
                {store.branches.some((branch) => branch.type === "Pusat") ? 1 : 0} gudang pusat)
              </span>
            </div>
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
                        placeholder="Contoh: Sitoba"
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
                        placeholder="CB008"
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
                      <span>
                        Alamat Lengkap
                        <em className="os-required" aria-hidden="true">*</em>
                      </span>
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
                        value={branchForm.city}
                        onChange={(event) => updateBranchForm("city", event.target.value)}
                        placeholder="Padang"
                        autoComplete="address-level2"
                      />
                    </label>
                  </div>

                  <div className="branch-account-section">
                    <div className="branch-account-section-head">
                      <div className="branch-account-section-copy">
                        <h3>
                          Akun Karyawan Cabang
                          <Info size={14} />
                        </h3>
                      </div>
                      <button className="btn btn-primary btn-sm" type="button" onClick={openCreateAccount}>
                        <Plus size={15} />
                        Tambah Akun
                      </button>
                    </div>

                    {pendingAccounts.length > 0 ? (
                      <div className="branch-account-list">
                        {pendingAccounts.map((account) => (
                          <div className="branch-account-row" key={account.key}>
                            <span className="branch-account-avatar">{initialsFromName(account.name)}</span>
                            <div className="branch-account-copy">
                              <b>{account.name}</b>
                              <span className="branch-account-username">{usernameLabel(account.username)}</span>
                            </div>
                            <div className="branch-account-meta">
                              <span className="branch-role-badge">
                                {account.role === "admin" ? "Admin Cabang" : "Kasir Cabang"}
                              </span>
                              <button
                                className="branch-account-action"
                                type="button"
                                title="Hapus akun"
                                aria-label={`Hapus akun ${account.name}`}
                                onClick={() => removePendingAccount(account.key)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="branch-account-empty branch-account-empty-box">
                        Belum ada akun karyawan ditambahkan. Klik <b>+ Tambah Akun</b> untuk membuat akun Admin atau
                        Kasir.
                      </div>
                    )}
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
                  <span>Password Awal *</span>
                  <span className="branch-password-wrap">
                    <input
                      className="os-input"
                      type={showPassword ? "text" : "password"}
                      value={accountForm.password}
                      onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })}
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      required
                      aria-describedby="password-help"
                    />
                    <button
                      type="button"
                      className="branch-password-toggle"
                      aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                      title={showPassword ? "Sembunyikan password" : "Lihat password"}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                  <small id="password-help" className="os-password-help">
                    Minimal 8 karakter, kombinasi huruf dan angka
                  </small>
                </label>
                <label className="os-field">
                  <span>Status Akun</span>
                  <div className="os-switch-wrapper">
                    <input
                      type="checkbox"
                      checked={accountForm.status === "aktif"}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          status: e.target.checked ? "aktif" : "nonaktif",
                        })
                      }
                    />
                    <span>{accountForm.status === "aktif" ? "Aktif" : "Nonaktif"}</span>
                  </div>
                </label>
              </div>
              <div className="os-modal-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <button className="btn btn-ghost" type="button" onClick={closeAccount} disabled={accountSaving}>
                  Batal
                </button>
                <button className="btn btn-primary" type="submit" disabled={accountSaving}>
                  {accountSaving ? "Menyimpan..." : "Tambahkan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modalOpen && modalMode === "create" && createAccountOpen ? (
        <div className="overlay branch-create-account-overlay" onClick={closeCreateAccount}>
          <div
            className="os-modal branch-account-modal branch-create-account-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-create-account-title"
          >
            <div className="os-modal-head">
              <div>
                <span className="os-eyebrow">TAMBAH AKUN KARYAWAN</span>
                <h2 id="branch-create-account-title">Tambah Akun: {branchForm.name.trim() || "Cabang Baru"}</h2>
              </div>
              <button className="icon-pill" type="button" aria-label="Tutup" onClick={closeCreateAccount}>
                <X size={18} />
              </button>
            </div>
            <form className="os-modal-body branch-create-body" onSubmit={submitCreateAccount} noValidate>
              {accountError ? (
                <div className="form-error" role="alert">
                  {accountError}
                </div>
              ) : null}
              <div className="os-form">
                <div className="os-form-grid">
                  <label className="os-field">
                    <span>
                      Nama Lengkap Karyawan
                      <em className="os-required" aria-hidden="true">*</em>
                    </span>
                    <input
                      className="os-input"
                      value={accountForm.name}
                      onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })}
                      placeholder="Contoh: Rina Marliana"
                      autoComplete="name"
                      autoFocus
                    />
                  </label>
                  <label className="os-field">
                    <span>
                      Peran / Jabatan
                      <em className="os-required" aria-hidden="true">*</em>
                    </span>
                    <select
                      className="os-input"
                      value={accountForm.role}
                      onChange={(event) =>
                        setAccountForm({ ...accountForm, role: event.target.value as AccountForm["role"] })
                      }
                    >
                      <option value="admin">Admin Cabang</option>
                      <option value="kasir">Kasir Cabang</option>
                    </select>
                  </label>
                  <label className="os-field">
                    <span>
                      Username / Email Login
                      <em className="os-required" aria-hidden="true">*</em>
                    </span>
                    <input
                      className="os-input"
                      value={accountForm.username}
                      onChange={(event) => setAccountForm({ ...accountForm, username: event.target.value })}
                      placeholder="rina@optikmekarjaya.com"
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
                      placeholder="0812-3456-7890"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="os-field">
                    <span>
                      Password Awal
                      <em className="os-required" aria-hidden="true">*</em>
                    </span>
                    <span className="branch-password-wrap">
                      <input
                        className="os-input"
                        type={showCreatePassword ? "text" : "password"}
                        value={accountForm.password}
                        onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })}
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                        aria-describedby="create-password-help"
                      />
                      <button
                        className="branch-password-toggle"
                        type="button"
                        aria-label={showCreatePassword ? "Sembunyikan password" : "Tampilkan password"}
                        onClick={() => setShowCreatePassword((current) => !current)}
                      >
                        {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </span>
                    <small id="create-password-help" className="os-password-help">
                      Minimal 8 karakter, kombinasi huruf dan angka
                    </small>
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
              </div>
              <div className="os-modal-actions">
                <button className="btn btn-ghost branch-action-btn" type="button" onClick={closeCreateAccount}>
                  Batal
                </button>
                <button className="btn btn-primary" type="submit">
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
