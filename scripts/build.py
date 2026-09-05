"""Package the existing static portfolio without a dependency installation."""
from pathlib import Path
from shutil import copy2, copytree, rmtree

root = Path(__file__).resolve().parent.parent
out = root / 'dist'
if out.exists():
    rmtree(out)
out.mkdir()
for path in root.glob('*.html'):
    copy2(path, out / path.name)
for directory in ('assets', 'public', 'forms'):
    copytree(root / directory, out / directory)
print('Static portfolio built in dist/')
