#!/usr/bin/env python3
"""Package only the public writer plugin; never follow symlinks or include local state."""
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "plugins" / "boomscrolling-writer"
allowed = {
    "plugin.json", "mcp.json", ".mcp.json", ".claude-plugin/plugin.json",
    "README.md", "LICENSE", "assets/icon.svg", "skills/boomscrolling-writer/SKILL.md",
}
if len(sys.argv) != 2:
    raise SystemExit("Use package-writer-plugin.py /chosen/path/boomscrolling-writer.zip")
output = Path(sys.argv[1]).expanduser().resolve()
if root in output.parents:
    raise SystemExit("Choose an output outside the plugin source.")
for name in allowed:
    path = root / name
    parts = Path(name).parts
    linked = root.is_symlink() or any(root.joinpath(*parts[:n]).is_symlink() for n in range(1, len(parts) + 1))
    if not path.is_file() or linked:
        raise SystemExit(f"Missing or symlinked public resource: {name}")
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for name in sorted(allowed):
        info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, (root / name).read_bytes())
print(output)
