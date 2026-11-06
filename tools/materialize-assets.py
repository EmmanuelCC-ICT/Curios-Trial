"""Reproduce this project's original visual/vendor assets from a pinned public source.
Only writes whitelisted paths in this new checkout. Never writes to Career Empire.
"""
from pathlib import Path
import hashlib,json,tarfile,tempfile,urllib.request,shutil
ROOT=Path(__file__).resolve().parents[1]
PROVENANCE=json.loads((ROOT/'docs/asset-provenance.json').read_text())
def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(1024*1024),b''):h.update(block)
    return h.hexdigest()
def materialize():
    missing={name:sha for name,sha in PROVENANCE['files'].items() if not (ROOT/name).is_file() or digest(ROOT/name)!=sha}
    if not missing:
        print('All retained visual/vendor assets match their recorded hashes.');return
    commit=PROVENANCE['commit'];prefix='GTCEM-Career-Empire-'+commit+'/'
    with tempfile.TemporaryDirectory() as temporary:
        archive=Path(temporary)/'source.tar.gz'
        urllib.request.urlretrieve('https://codeload.github.com/Emmanuel-ICT-Support/GTCEM-Career-Empire/tar.gz/'+commit,archive)
        if digest(archive)!=PROVENANCE['archiveSha256']:raise RuntimeError('Pinned source archive hash differs.')
        with tarfile.open(archive) as source:
            for member in source:
                if not member.isfile() or not member.name.startswith(prefix):continue
                relative=member.name[len(prefix):]
                if relative not in missing:continue
                destination=(ROOT/relative).resolve()
                if ROOT not in destination.parents:raise RuntimeError('Invalid destination')
                destination.parent.mkdir(parents=True,exist_ok=True)
                with source.extractfile(member) as original,destination.open('wb') as target:shutil.copyfileobj(original,target)
                if digest(destination)!=missing.pop(relative):raise RuntimeError('Asset hash differs: '+relative)
    if missing:raise RuntimeError('Missing original assets: '+str(list(missing)))
    print('Independent assets materialised and hash verified.')
if __name__=='__main__':materialize()
