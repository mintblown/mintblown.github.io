"""Run the real training in installed headless Chrome, without third-party packages.

Usage: python3 ifef/klausurtraining/tests/run_browser.py
Optional: CHROME_BIN=/path/to/chrome python3 ...
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from html import unescape
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1] / 'html'
CHROME = os.environ.get('CHROME_BIN', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
SOURCE = (ROOT / 'index.html').read_text().replace('<head>', '<head><base href="' + ROOT.as_uri() + '/">')


def run(page, profile, width, height, before='', after='', screenshot=None):
    before += '''
window.storageReads=0;window.storageWrites=0;
const savedGet=Storage.prototype.getItem,savedSet=Storage.prototype.setItem;
Storage.prototype.getItem=function(...args){window.storageReads++;return savedGet.apply(this,args);};
Storage.prototype.setItem=function(...args){window.storageWrites++;return savedSet.apply(this,args);};
'''
    html = SOURCE.replace('<script defer src="content.js">', '<script>' + before + '</script><script defer src="content.js">')
    html = html.replace('</head>', after + '</head>')
    page.write_text(html)
    args = [CHROME, '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
            '--user-data-dir=' + str(profile), '--virtual-time-budget=12000', '--dump-dom',
            f'--window-size={width},{height}']
    if screenshot:
        args.append('--screenshot=' + str(screenshot))
    process = subprocess.run(args + [page.as_uri()], capture_output=True, text=True, timeout=60)
    if process.returncode:
        raise RuntimeError(process.stderr[-2000:])
    result = re.search(r'<pre id="test-result"[^>]*>(.*?)</pre>', process.stdout, re.S)
    message = unescape(result.group(1)) if result else 'FAIL: test script did not finish'
    print(f'{width}×{height}: {message}')
    if not message.startswith('PASS:'):
        raise AssertionError(message)


def assertion_script(checks, persist=True):
    return '''<script>addEventListener('load',()=>{const p=document.createElement('pre');p.id='test-result';p.hidden=true;document.body.append(p);try{
const assert=(value,message)=>{if(!value)throw Error(message);};
assert(window.storageReads===0&&window.storageWrites===0,'No storage access before consent');
assert(typeof Training==='undefined','No training before consent');
document.getElementById('consent-checkbox').click();
''' + ("document.getElementById('save-for-later').click();" if persist else '') + '''
document.getElementById('consent-start').click();
''' + checks + ''';p.textContent='PASS: saved-state and storage checks';}catch(e){p.textContent='FAIL: '+e.stack;}});</script>'''


with TemporaryDirectory(prefix='ifef-training-qa-') as temp:
    base = Path(temp)
    page = base / 'check.html'
    suite = '<script defer src="../tests/browser.test.js"></script>'
    run(page, base / 'desktop', 1440, 1100, before='localStorage.removeItem("ifef-klausurtraining-v1");', after=suite)
    run(page, base / 'desktop', 1440, 1100, after=assertion_script('''
const state=Training.getState();assert(state.solved.length===40,'Solved tasks survive reopening');
assert(document.querySelectorAll('.badge.won').length===9,'Badges survive reopening');
assert(!document.getElementById('block-complete').hidden,'Completion reminder survives reopening');
'''))
    run(page, base / 'mobile', 390, 844, before='localStorage.removeItem("ifef-klausurtraining-v1");', after=suite)
    run(page, base / 'corrupt', 390, 844,
        before='localStorage.setItem("ifef-klausurtraining-v1",JSON.stringify({station:999,question:-1,solved:["0-0","0-0","0-3","fake"],reviewed:["fake"],notes:{0:"<img src=x onerror=alert(1)>"}}));',
        after=assertion_script('''
const state=Training.getState();assert(state.station===0&&state.question===0,'Invalid navigation repaired');
assert(state.solved.length===1&&state.reviewed.length===0,'Progress validated; only replaced task requires a new answer');
assert(document.getElementById('notes').value.includes('<img'),'Notes shown as plain text');
'''))
    run(page, base / 'blocked', 390, 844,
        before='Storage.prototype.getItem=function(){throw Error("blocked");};Storage.prototype.setItem=function(){throw Error("blocked");};',
        after=assertion_script('''
assert(document.querySelectorAll('#stations button').length===9,'App works without storage');
assert(document.getElementById('storage-status').textContent.includes('keine dauerhafte Speicherung'),'Storage limitation visible');
Training.selectStation(7);assert(document.getElementById('object-step'),'Interactive lessons remain available');
'''))
    run(page, base / 'session', 390, 844,
        before='localStorage.setItem("ifef-klausurtraining-v1",JSON.stringify({contentRevision:2,station:0,question:0,solved:["0-0"],notes:{0:"Früherer Stand"}}));',
        after=assertion_script('''
assert(window.storageReads===0&&window.storageWrites===0,'Session-only startup does not access localStorage');
assert(Training.getState().solved.length===0&&document.getElementById('notes').value==='','Old saved state not loaded without persistence choice');
document.getElementById('notes').value='Nur in dieser Sitzung';document.getElementById('notes').dispatchEvent(new Event('input'));
document.querySelector('[name="decimal"]').value='45';document.getElementById('answer-form').requestSubmit();
assert(Training.getState().solved.length===1,'Session-only answers work');
Training.selectStation(1);Training.selectStation(0);
assert(document.getElementById('notes').value==='Nur in dieser Sitzung','Session notes survive station changes');
assert(window.storageReads===0&&window.storageWrites===0,'Session interactions never access localStorage');
const old=JSON.parse(savedGet.call(localStorage,'ifef-klausurtraining-v1'));
assert(old.notes[0]==='Früherer Stand','Existing persistent data remains untouched');
assert(document.getElementById('storage-status').textContent.includes('nur in dieser geöffneten Seite'),'Session-only mode explained');
''', persist=False))
