from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
target=root/'_site'
if target.exists():shutil.rmtree(target)
target.mkdir()
for name in ['index.html','teacher.html','teacher-editor.mjs','world-config.json','.nojekyll']:shutil.copy2(root/name,target/name)
shutil.copytree(root/'playable-3d',target/'playable-3d')
print('Static site packaged.')
