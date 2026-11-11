type AdminPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const PAGE_SIZES = [25, 50, 100];

export default function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  if (total === 0) return null;

  const pageCount = Math.ceil(total / pageSize);
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div className="table-foot admin-pagination">
      <span className="foot-note">Menampilkan {firstItem}–{lastItem} dari {total}</span>
      <label className="admin-pagination-size">
        <span>Per halaman</span>
        <select
          aria-label="Jumlah baris per halaman"
          value={pageSize}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value));
            onPageChange(1);
          }}
        >
          {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <div className="admin-pagination-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Sebelumnya
        </button>
        <span className="foot-note">Halaman {page} dari {pageCount}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          Berikutnya
        </button>
      </div>
    </div>
  );
}
