"""Local C playback bridge. The existing bedroom page owns the show clock."""
import argparse
import functools
import json
import math
import threading
import time
import uuid
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

lock = threading.Lock()
epoch = uuid.uuid4().hex
player = None
pending = None
commands = {}


def fresh():
    return player is not None and time.monotonic() - player['seen'] < 4 and player['ready']


def status():
    global pending
    if pending and time.monotonic() > pending['expires']:
        commands[pending['id']]['state'] = 'unknown'
        pending = None
    return dict(protocol='x-playback-v1', zoneId='C', epoch=epoch, ready=fresh(),
                playback=player['playback'] if player else None,
                outputs=[dict(id='main', ready=fresh(), visible=player.get('visible') if player else None, rendering=player.get('rendering') if player else None)],
                command=list(commands.values())[-1] if commands else None,
                scope='睡眠劇場主頁；窗景與 TouchDesigner 接收狀態未驗證')


def report(p):
    global player, pending
    status()
    identity = p.get('instance')
    if not isinstance(identity, str) or not 1 <= len(identity) <= 80:
        raise ValueError('invalid player')
    if player and player['id'] != identity and time.monotonic() - player['seen'] < 4:
        return dict(error='已有主頁連線，請勿重複開啟控制主頁'), 409
    if p.get('epoch') != epoch:
        return dict(epoch=epoch), 200
    playback = p.get('playback')
    if not isinstance(playback, dict):
        raise ValueError('invalid playback')
    for key in ('position', 'duration'):
        if not isinstance(playback.get(key), (int, float)) or not math.isfinite(playback[key]):
            raise ValueError('invalid clock')
    if not 0 <= playback['position'] <= playback['duration'] <= 3600:
        raise ValueError('invalid duration')
    if type(playback.get('playing')) is not bool or type(p.get('ready')) is not bool:
        raise ValueError('invalid readiness')
    player = dict(id=identity, seen=time.monotonic(), ready=p['ready'], playback=playback,
                  visible=p.get('visible'), rendering=p.get('rendering'))
    if pending and pending['owner'] == identity and p.get('appliedId') == pending['id']:
        commands[pending['id']]['state'] = 'rejected' if p.get('error') else 'applied'
        commands[pending['id']]['note'] = str(p.get('error') or '主頁已套用')[:200]
        pending = None
    cmd = {k: pending[k] for k in ('id', 'operation')} if pending and pending['owner'] == identity else None
    return dict(epoch=epoch, command=cmd), 200


def control(p):
    global pending
    status()
    if p.get('epoch') != epoch:
        return dict(error='服務已重開，請重新取得狀態'), 409
    cid, operation = p.get('id'), p.get('operation')
    if not isinstance(cid, str) or not 1 <= len(cid) <= 80 or operation not in ('start', 'play', 'pause', 'replay', 'standby'):
        raise ValueError('invalid command')
    if cid in commands:
        return commands[cid], 200
    if not fresh():
        return dict(error='睡眠劇場主頁尚未就緒'), 503
    if pending:
        return dict(error='上一個操作尚未完成'), 409
    pending = dict(id=cid, operation=operation, owner=player['id'], expires=time.monotonic() + 3)
    commands[cid] = dict(id=cid, state='accepted')
    while len(commands) > 100:
        commands.pop(next(iter(commands)))
    return commands[cid], 202


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def reply(self, value, code=200):
        body = json.dumps(value, ensure_ascii=False, allow_nan=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path.split('?')[0] == '/api/x/status':
            with lock: self.reply(status())
        else: super().do_GET()
    def do_POST(self):
        # LAN browsers use X authentication; local pages report to their own origin.
        if self.headers.get('Origin') not in (None, 'http://' + self.headers.get('Host', '')):
            return self.reply(dict(error='origin rejected'), 403)
        if self.path not in ('/api/x/report', '/api/x/control'):
            return self.reply(dict(error='not found'), 404)
        try:
            size = int(self.headers.get('Content-Length', 0))
            if not 0 < size <= 8192: raise ValueError('invalid body')
            p = json.loads(self.rfile.read(size))
            if not isinstance(p, dict): raise ValueError('invalid payload')
            with lock:
                value, code = report(p) if self.path.endswith('/report') else control(p)
            self.reply(value, code)
        except (ValueError, KeyError, TypeError): self.reply(dict(error='invalid request'), 400)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    print(f'C-Web: http://127.0.0.1:{args.port}/Cweb-3d.html?x=1', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), functools.partial(Handler, directory=str(root))).serve_forever()
