"""Hapus aset build lama di /htdocs/app/assets pada hosting InfinityFree.

Nama berkas Vite memakai hash, jadi setiap build menghasilkan nama baru dan
berkas lama akan menumpuk bila tidak dibersihkan. Skrip ini hanya menghapus
berkas yang tidak ada di hasil build terbaru; berkas lain tidak disentuh.
"""

import ftplib
import os
import pathlib
import sys

REMOTE_ASSETS = "/htdocs/app/assets"


def main() -> int:
    host = os.environ["FTP_SERVER"]
    user = os.environ["FTP_USERNAME"]
    password = os.environ["FTP_PASSWORD"]

    local_dir = pathlib.Path("Backend/public/app/assets")
    keep = {path.name for path in local_dir.iterdir() if path.is_file()}

    ftp = ftplib.FTP(host, timeout=90)
    ftp.login(user, password)
    ftp.cwd(REMOTE_ASSETS)
    remote = {os.path.basename(name) for name in ftp.nlst()} - {".", ".."}

    removed = 0
    for name in sorted(remote - keep):
        try:
            ftp.delete(name)
            removed += 1
            print(f"dihapus: {name}")
        except ftplib.all_errors as error:
            print(f"gagal hapus {name}: {error}")

    ftp.quit()
    print(f"aset lokal: {len(keep)}, aset server: {len(remote)}, dihapus: {removed}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
