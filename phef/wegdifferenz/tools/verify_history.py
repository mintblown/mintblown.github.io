#!/usr/bin/env python3
"""Verify numeric lesson QR payload: python3 verify_history.py 'SCANNED_DIGITS'."""
import argparse
import hashlib
import hmac
import json


def verify(payload):
    if not payload.isascii() or not payload.isdigit() or len(payload) < 90 or payload[0] != '1':
        raise ValueError('Ungültiges Format oder unbekannte Version.')
    count = int(payload[1:3])
    if len(payload) != 90 + 9 * count:
        raise ValueError('Länge passt nicht zur Aufgabenanzahl.')
    body, signature = payload[:-78], payload[-78:]
    digest = hmac.new(b'kkg', body.encode('ascii'), hashlib.sha256).digest()
    expected = str(int.from_bytes(digest, 'big')).zfill(78)
    if not hmac.compare_digest(signature, expected):
        raise ValueError('Prüfwert stimmt nicht überein.')
    return {'anzahl': count, 'sekunden_pro_aufgabe': [int(body[i:i+9]) for i in range(12, len(body), 9)], 'falsche_eingaben': int(body[3:12])}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('payload')
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.payload), ensure_ascii=False, indent=2))
    except ValueError as error:
        parser.exit(1, f'{error}\n')
