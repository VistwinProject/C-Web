"""Loopback HTTP -> OSC/UDP bridge. Run: python tools/osc_bridge.py"""
import argparse
import ipaddress
import json
import re
import socket
import struct
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ALLOWED_ORIGINS = {'http://127.0.0.1:8765', 'http://localhost:8765', 'https://vistwinproject.github.io'}

def packet(address, value):
    if not isinstance(address, str) or not re.fullmatch(r'/[A-Za-z0-9_/-]{1,120}', address):
        raise ValueError('Invalid OSC address')
    if type(value) is not int or value not in (0, 1):
        raise ValueError('Value must be integer 0 or 1')
    def padded(s):
        data=s.encode('ascii')+b'\0'
        return data+b'\0'*((-len(data))%4)
    return padded(address)+padded(',i')+struct.pack('>i',value)

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, body):
        data=json.dumps(body).encode()
        self.send_response(status)
        origin=self.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin',origin)
            self.send_header('Vary','Origin')
        self.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type')
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.reply(204 if self.headers.get('Origin') in ALLOWED_ORIGINS else 403,{})

    def do_POST(self):
        if self.headers.get('Origin') not in ALLOWED_ORIGINS:
            return self.reply(403,{'error':'Origin not allowed'})
        if self.path!='/osc':
            return self.reply(404,{'error':'Not found'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=2048:raise ValueError('Invalid body size')
            data=json.loads(self.rfile.read(length))
            host=ipaddress.IPv4Address(data['host'])
            if not (host.is_loopback or host in ipaddress.ip_network('10.0.0.0/8') or host in ipaddress.ip_network('172.16.0.0/12') or host in ipaddress.ip_network('192.168.0.0/16')):
                raise ValueError('Use loopback or private LAN IPv4')
            port=data['port']
            if type(port) is not int or not 1<=port<=65535:raise ValueError('Invalid UDP port')
            payload=packet(data['address'],data['value'])
            with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as udp:
                udp.sendto(payload,(str(host),port))
            self.reply(200,{'sent':True,'bytes':len(payload)})
        except (ValueError,KeyError,TypeError,OSError) as error:
            self.reply(400,{'error':str(error)})

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8766)
    args=parser.parse_args()
    print(f'OSC bridge http://127.0.0.1:{args.port}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
