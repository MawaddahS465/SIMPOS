/**
 * Logo "MR" — badge bulat biru dengan monogram putih,
 * memakai aset gambar logo toko.
 */
export default function MRLogo({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/assets/logo-mk.png"
      width={size}
      height={size}
      alt="Logo Optik Mekar Jaya"
      className={className}
      style={{ flex: "none", display: "block" }}
    />
  );
}
